import type { ProcessSample, SystemStatus, Telemetry } from '../types/diagnosis'
import { apiRequest } from './apiClient'

/** La captura tarda ~15 s (muestreo de CPU y procesos); se deja margen. */
const CAPTURE_TIMEOUT_MS = 60_000

const STATUSES: readonly SystemStatus[] = ['NORMAL', 'WARNING', 'CRITICAL']

export class InvalidTelemetryError extends Error {
  constructor() {
    super('Invalid telemetry payload')
    this.name = 'InvalidTelemetryError'
  }
}

const num = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0)

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

/** Valida y normaliza la respuesta del backend: la UI nunca recibe datos malformados. */
const parseTelemetry = (raw: unknown): Telemetry => {
  if (!isRecord(raw)) throw new InvalidTelemetryError()
  const status = STATUSES.find((s) => s === raw.status) ?? 'NORMAL'
  const processes: ProcessSample[] = Array.isArray(raw.processes)
    ? raw.processes.filter(isRecord).map((p) => ({
        pid: num(p.pid),
        name: typeof p.name === 'string' ? p.name : '—',
        cpu: num(p.cpu),
        memory: num(p.memory),
      }))
    : []

  return {
    cpu: num(raw.cpu),
    ram: num(raw.ram),
    disk_space: num(raw.disk_space),
    disk_read: num(raw.disk_read),
    disk_write: num(raw.disk_write),
    cpu_temperature:
      typeof raw.cpu_temperature === 'number' && Number.isFinite(raw.cpu_temperature) ? raw.cpu_temperature : null,
    temperature_source: typeof raw.temperature_source === 'string' ? raw.temperature_source : null,
    status,
    issues: strings(raw.issues),
    recommendations: strings(raw.recommendations),
    causes: strings(raw.causes),
    processes,
  }
}

export const telemetryService = {
  /**
   * Captura CPU, RAM, almacenamiento, temperatura y procesos (POST /diagnose).
   * Lanza `ApiError` si el servicio no está disponible.
   */
  async capture(options: { signal?: AbortSignal; accessToken?: string } = {}): Promise<Telemetry> {
    const body = await apiRequest('/diagnose', {
      method: 'POST',
      signal: options.signal,
      timeoutMs: CAPTURE_TIMEOUT_MS,
      headers: options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : undefined,
    })
    return parseTelemetry(body)
  },

  /** Último diagnóstico guardado por `python main.py` (public/diagnosis.json, servido por Vite). */
  async loadLatest(signal?: AbortSignal): Promise<Telemetry | null> {
    try {
      const response = await fetch('/diagnosis.json', { signal })
      return response.ok ? parseTelemetry(await response.json()) : null
    } catch {
      return null
    }
  },
}
