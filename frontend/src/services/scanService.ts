import type { Telemetry } from '../types/diagnosis'
import type { ScanJobUpdate, ScanStep, ScanType } from '../types/scan'
import { ApiError, apiRequest } from './apiClient'
import { parseTelemetry } from './telemetryService'

/**
 * Escaneos en segundo plano del servicio local (POST /scans, GET /scans/:id).
 * El cliente consulta el avance periódicamente para mostrar en qué paso va.
 */

const POLL_INTERVAL_MS = 700
const REQUEST_TIMEOUT_MS = 10_000
/** Límite total, con margen sobre la duración habitual (~20 s y ~1 min). */
const MAX_DURATION_MS: Readonly<Record<ScanType, number>> = { basic: 120_000, advanced: 240_000 }

const STEPS: readonly ScanStep[] = ['metrics', 'processes', 'monitor', 'hardware', 'rules']

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

interface ScanJob extends ScanJobUpdate {
  id: string
  status: 'running' | 'completed' | 'failed'
  result: unknown
  error: string | null
}

const parseJob = (raw: unknown): ScanJob => {
  if (!isRecord(raw) || typeof raw.id !== 'string') throw new ApiError('http', { status: 502, body: raw })
  const status = raw.status === 'completed' || raw.status === 'failed' ? raw.status : 'running'
  const fraction = typeof raw.step_fraction === 'number' && Number.isFinite(raw.step_fraction) ? raw.step_fraction : 0
  return {
    id: raw.id,
    status,
    step: STEPS.find((step) => step === raw.step) ?? 'metrics',
    stepFraction: Math.min(1, Math.max(0, fraction)),
    result: raw.result,
    error: typeof raw.error === 'string' ? raw.error : null,
  }
}

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason)
    const id = window.setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(id)
        reject(signal.reason)
      },
      { once: true },
    )
  })

export const scanService = {
  /**
   * Ejecuta un escaneo y resuelve con su telemetría. `onProgress` recibe el paso en curso.
   * Lanza `ApiError` (409 si ya hay otro escaneo en marcha) o el `AbortError` del llamador.
   */
  async run(type: ScanType, options: { signal?: AbortSignal; onProgress?: (update: ScanJobUpdate) => void } = {}): Promise<Telemetry> {
    const { signal, onProgress } = options
    const deadline = Date.now() + MAX_DURATION_MS[type]
    let job = parseJob(await apiRequest('/scans', { method: 'POST', json: { type }, signal, timeoutMs: REQUEST_TIMEOUT_MS }))

    for (;;) {
      onProgress?.({ step: job.step, stepFraction: job.stepFraction })
      if (job.status === 'completed') return parseTelemetry(job.result)
      if (job.status === 'failed') throw new ApiError('http', { status: 500, body: { error: job.error } })
      if (Date.now() > deadline) throw new ApiError('timeout')

      await wait(POLL_INTERVAL_MS, signal)
      job = parseJob(await apiRequest(`/scans/${encodeURIComponent(job.id)}`, { signal, timeoutMs: REQUEST_TIMEOUT_MS }))
    }
  },
}
