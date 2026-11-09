import type { AIDiagnosis, Telemetry } from '../types/diagnosis'
import { parseHardware, toHardwarePayload } from './hardwareService'
import { getHealthScore, getHighlightedProcesses } from './healthService'
import { parseProcess, parseProcessSummary } from './processParsing'
import { supabase } from './supabaseClient'

/**
 * Persistencia de informes en la tabla `diagnostic_reports` de Supabase
 * (columnas: id, user_id, created_at, ai_diagnosis jsonb o text).
 *
 * La inserción viaja con el JWT del usuario, así que la política RLS
 * (ver supabase/migrations) garantiza que cada usuario solo escribe y lee sus filas.
 */

export const REPORT_SCHEMA_VERSION = 1

/** Contenido de la columna `ai_diagnosis`. */
export interface DiagnosticReportPayload {
  version: typeof REPORT_SCHEMA_VERSION
  generated_at: string
  language: AIDiagnosis['language']
  source: AIDiagnosis['source']
  model: string | null
  health_score: number
  scan_type: Telemetry['scan_type']
  process_summary: Telemetry['process_summary']
  status: AIDiagnosis['status']
  summary: string
  probable_cause: AIDiagnosis['probableCause']
  findings: AIDiagnosis['findings']
  solutions: AIDiagnosis['solutions']
  telemetry: {
    cpu: number
    ram: number
    disk_space: number
    disk_read: number
    disk_write: number
    cpu_temperature: number | null
    temperature_source: string | null
    rule_based_status: Telemetry['status']
    rule_based_issues: string[]
    processes: Telemetry['processes']
    /** Formato del colector; solo en análisis avanzados. */
    hardware: ReturnType<typeof toHardwarePayload> | null
  }
}

export interface SavedReport {
  id: string
  createdAt: string
}

export type SaveReportError = 'notConfigured' | 'unauthorized' | 'network' | 'unknown'

export type SaveReportResult = { ok: true; report: SavedReport } | { ok: false; error: SaveReportError; code?: string }

export const toReportPayload = (telemetry: Telemetry, diagnosis: AIDiagnosis): DiagnosticReportPayload => ({
  version: REPORT_SCHEMA_VERSION,
  generated_at: diagnosis.generatedAt,
  language: diagnosis.language,
  source: diagnosis.source,
  model: diagnosis.model,
  health_score: getHealthScore(telemetry),
  scan_type: telemetry.scan_type,
  process_summary: telemetry.process_summary,
  status: diagnosis.status,
  summary: diagnosis.summary,
  probable_cause: diagnosis.probableCause,
  findings: diagnosis.findings,
  solutions: diagnosis.solutions,
  telemetry: {
    cpu: telemetry.cpu,
    ram: telemetry.ram,
    disk_space: telemetry.disk_space,
    disk_read: telemetry.disk_read,
    disk_write: telemetry.disk_write,
    cpu_temperature: telemetry.cpu_temperature,
    temperature_source: telemetry.temperature_source,
    rule_based_status: telemetry.status,
    rule_based_issues: telemetry.issues,
    processes: getHighlightedProcesses(telemetry.processes, 10),
    hardware: telemetry.hardware && toHardwarePayload(telemetry.hardware),
  },
})

export const reportsService = {
  async save(userId: string, telemetry: Telemetry, diagnosis: AIDiagnosis): Promise<SaveReportResult> {
    if (!supabase) return { ok: false, error: 'notConfigured' }

    try {
      const { data, error } = await supabase
        .from('diagnostic_reports')
        .insert({ user_id: userId, ai_diagnosis: toReportPayload(telemetry, diagnosis) })
        .select('id, created_at')
        .single()

      if (error) {
        if (import.meta.env.DEV) console.warn('[Nexora] could not save report', error)
        return { ok: false, error: toReportError(error.code), code: error.code || undefined }
      }

      return { ok: true, report: { id: String(data.id), createdAt: String(data.created_at) } }
    } catch {
      return { ok: false, error: 'network' }
    }
  },

  /** Informes del usuario autenticado, del más reciente al más antiguo (RLS filtra por usuario). */
  async list(limit = REPORTS_PAGE_SIZE): Promise<ListReportsResult> {
    if (!supabase) return { ok: false, error: 'notConfigured' }

    try {
      const { data, error } = await supabase
        .from('diagnostic_reports')
        .select('id, created_at, ai_diagnosis')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) return { ok: false, error: toReportError(error.code) }

      const reports = (data ?? []).flatMap((row) => {
        const payload = parsePayload(row.ai_diagnosis)
        return payload ? [{ id: String(row.id), createdAt: String(row.created_at), payload }] : []
      })
      return { ok: true, reports }
    } catch {
      return { ok: false, error: 'network' }
    }
  },

  /** Un informe del usuario autenticado; `notFound` si no existe o pertenece a otra cuenta (RLS). */
  async get(id: string): Promise<GetReportResult> {
    if (!supabase) return { ok: false, error: 'notConfigured' }

    try {
      const { data, error } = await supabase.from('diagnostic_reports').select('id, created_at, ai_diagnosis').eq('id', id).maybeSingle()
      if (error) return { ok: false, error: error.code === '22P02' ? 'notFound' : toReportError(error.code) }
      const payload = data ? parsePayload(data.ai_diagnosis) : null
      if (!data || !payload) return { ok: false, error: 'notFound' }
      return { ok: true, report: { id: String(data.id), createdAt: String(data.created_at), payload } }
    } catch {
      return { ok: false, error: 'network' }
    }
  },

  async remove(id: string): Promise<RemoveReportResult> {
    if (!supabase) return { ok: false, error: 'notConfigured' }

    try {
      // `count: 'exact'` permite detectar un borrado que RLS haya filtrado (0 filas).
      const { error, count } = await supabase.from('diagnostic_reports').delete({ count: 'exact' }).eq('id', id)
      if (error) return { ok: false, error: toReportError(error.code) }
      if (count === 0) return { ok: false, error: 'unauthorized' }
      return { ok: true }
    } catch {
      return { ok: false, error: 'network' }
    }
  },
}

// --- Lectura --------------------------------------------------------------

export const REPORTS_PAGE_SIZE = 50

export interface StoredReport {
  id: string
  createdAt: string
  payload: DiagnosticReportPayload
}

export type ListReportsResult = { ok: true; reports: StoredReport[] } | { ok: false; error: SaveReportError }
export type RemoveReportResult = { ok: true } | { ok: false; error: SaveReportError }
/** 22P02: el id no tiene el formato de la columna, equivale a "no existe". */
export type GetReportResult = { ok: true; report: StoredReport } | { ok: false; error: SaveReportError | 'notFound' }

/** 42501: violación de RLS · PGRST30x: JWT inválido o caducado · sin código: la petición no llegó. */
const toReportError = (code: string | undefined): SaveReportError => {
  if (!code) return 'network'
  return code === '42501' || code.startsWith('PGRST30') ? 'unauthorized' : 'unknown'
}

const STATUSES: readonly DiagnosticReportPayload['status'][] = ['NORMAL', 'WARNING', 'CRITICAL']
const SEVERITIES = ['ok', 'warn', 'crit'] as const
const IMPACTS = ['low', 'medium', 'high'] as const
const METRICS = ['cpu', 'ram', 'disk', 'temperature', 'process', 'none'] as const

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const str = (value: unknown): string => (typeof value === 'string' ? value : '')
const num = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0)
const pick = <T extends string>(options: readonly T[], value: unknown, fallback: T): T =>
  options.find((option) => option === value) ?? fallback
const records = (value: unknown): Record<string, unknown>[] => (Array.isArray(value) ? value.filter(isRecord) : [])

/** En tablas antiguas `ai_diagnosis` es de tipo text: Supabase devuelve el JSON como cadena. */
const decodeColumn = (value: unknown): unknown => {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

/**
 * Valida el JSON de `ai_diagnosis`. Las filas son datos persistidos (pueden venir de
 * versiones anteriores o haberse editado a mano), así que nunca se confía en su forma.
 * Devuelve `null` si la fila no es un informe de Nexora reconocible.
 */
export const parsePayload = (column: unknown): DiagnosticReportPayload | null => {
  const raw = decodeColumn(column)
  if (!isRecord(raw) || !isRecord(raw.telemetry) || !isRecord(raw.probable_cause)) return null
  const telemetry = raw.telemetry
  const cause = raw.probable_cause

  return {
    version: REPORT_SCHEMA_VERSION,
    generated_at: str(raw.generated_at),
    language: raw.language === 'en' ? 'en' : 'es',
    source: raw.source === 'ai' ? 'ai' : 'rules',
    model: typeof raw.model === 'string' ? raw.model : null,
    health_score: Math.round(Math.min(100, Math.max(0, num(raw.health_score)))),
    scan_type: raw.scan_type === 'deep' ? 'deep' : 'standard',
    process_summary: parseProcessSummary(raw.process_summary),
    status: pick(STATUSES, raw.status, 'NORMAL'),
    summary: str(raw.summary),
    probable_cause: { title: str(cause.title), explanation: str(cause.explanation), metric: pick(METRICS, cause.metric, 'none') },
    findings: records(raw.findings).map((f) => ({
      title: str(f.title),
      detail: str(f.detail),
      severity: pick(SEVERITIES, f.severity, 'ok'),
      metric: pick(METRICS, f.metric, 'none'),
    })),
    solutions: records(raw.solutions).map((s) => ({
      title: str(s.title),
      description: str(s.description),
      impact: pick(IMPACTS, s.impact, 'medium'),
      steps: Array.isArray(s.steps) ? s.steps.filter((step): step is string => typeof step === 'string') : [],
    })),
    telemetry: {
      cpu: num(telemetry.cpu),
      ram: num(telemetry.ram),
      disk_space: num(telemetry.disk_space),
      disk_read: num(telemetry.disk_read),
      disk_write: num(telemetry.disk_write),
      cpu_temperature: typeof telemetry.cpu_temperature === 'number' ? telemetry.cpu_temperature : null,
      temperature_source: typeof telemetry.temperature_source === 'string' ? telemetry.temperature_source : null,
      rule_based_status: pick(STATUSES, telemetry.rule_based_status, 'NORMAL'),
      rule_based_issues: Array.isArray(telemetry.rule_based_issues)
        ? telemetry.rule_based_issues.filter((issue): issue is string => typeof issue === 'string')
        : [],
      processes: records(telemetry.processes).map(parseProcess),
      hardware: isRecord(telemetry.hardware) ? toHardwarePayload(parseHardware(telemetry.hardware)) : null,
    },
  }
}
