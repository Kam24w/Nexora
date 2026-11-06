import type { Telemetry, ProcessSample, SystemStatus } from '../types/diagnosis'

const API_URL = (import.meta.env.VITE_DIAGNOSIS_API_URL ?? 'http://127.0.0.1:5000').replace(/\/+$/, '')

export class DiagnosisUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('Diagnosis service unavailable', { cause })
    this.name = 'DiagnosisUnavailableError'
  }
}

export const API_BASE_URL = API_URL

const STATUSES: readonly SystemStatus[] = ['NORMAL', 'WARNING', 'CRITICAL']

const num = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0)

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/** Valida y normaliza la respuesta del backend: la UI nunca recibe datos malformados. */
const parseTelemetry = (raw: unknown): Telemetry => {
  if (!isRecord(raw)) throw new DiagnosisUnavailableError('Invalid payload')
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

const request = async (input: string, init?: RequestInit): Promise<Telemetry> => {
  let response: Response
  try {
    response = await fetch(input, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new DiagnosisUnavailableError(error)
  }
  if (!response.ok) throw new DiagnosisUnavailableError(response.status)
  return parseTelemetry(await response.json())
}

export const diagnosisService = {
  /** Captura CPU, RAM, almacenamiento, temperatura y procesos (POST /diagnose). */
  run(options: { signal?: AbortSignal; accessToken?: string } = {}): Promise<Telemetry> {
    return request(`${API_URL}/diagnose`, {
      method: 'POST',
      signal: options.signal,
      headers: options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : undefined,
    })
  },

  /** Último diagnóstico guardado (public/diagnosis.json). Devuelve null si no existe. */
  async loadLatest(signal?: AbortSignal): Promise<Telemetry | null> {
    try {
      return await request('/diagnosis.json', { signal })
    } catch {
      return null
    }
  },
}
