import type { AIDiagnosis, Telemetry } from '../types/diagnosis'
import { getHealthScore, getTopProcesses } from './healthService'
import { supabase } from './supabaseClient'

/**
 * Persistencia de informes en la tabla `diagnostic_reports` de Supabase
 * (columnas: id, user_id, created_at, ai_diagnosis jsonb).
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
  }
}

export interface SavedReport {
  id: string
  createdAt: string
}

export type SaveReportError = 'notConfigured' | 'unauthorized' | 'network' | 'unknown'

export type SaveReportResult = { ok: true; report: SavedReport } | { ok: false; error: SaveReportError }

export const toReportPayload = (telemetry: Telemetry, diagnosis: AIDiagnosis): DiagnosticReportPayload => ({
  version: REPORT_SCHEMA_VERSION,
  generated_at: diagnosis.generatedAt,
  language: diagnosis.language,
  source: diagnosis.source,
  model: diagnosis.model,
  health_score: getHealthScore(telemetry),
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
    processes: getTopProcesses(telemetry.processes, 10),
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
        // 42501: violación de RLS · PGRST301/PGRST303: JWT inválido o caducado
        const unauthorized = error.code === '42501' || error.code?.startsWith('PGRST30')
        return { ok: false, error: unauthorized ? 'unauthorized' : 'unknown' }
      }

      return { ok: true, report: { id: String(data.id), createdAt: String(data.created_at) } }
    } catch {
      return { ok: false, error: 'network' }
    }
  },
}
