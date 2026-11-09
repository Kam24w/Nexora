import type { ProcessCategory, ProcessSample, ProcessSummary } from '../types/diagnosis'

const CATEGORIES: readonly ProcessCategory[] = ['system', 'system_unverified', 'suspicious', 'application']

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const num = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0)

/** Normaliza un proceso del backend o de un informe guardado (los antiguos no traen categoría ni ruta). */
export const parseProcess = (raw: Record<string, unknown>): ProcessSample => ({
  pid: num(raw.pid),
  name: typeof raw.name === 'string' && raw.name ? raw.name : '—',
  cpu: num(raw.cpu),
  memory: num(raw.memory),
  category: CATEGORIES.find((category) => category === raw.category) ?? 'application',
  path: typeof raw.path === 'string' && raw.path ? raw.path : null,
})

export const parseProcessSummary = (raw: unknown): ProcessSummary | null =>
  isRecord(raw)
    ? {
        total: num(raw.total),
        system: num(raw.system),
        system_unverified: num(raw.system_unverified),
        suspicious: num(raw.suspicious),
        application: num(raw.application),
      }
    : null
