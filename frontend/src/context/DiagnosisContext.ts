import type { AIFailureReason } from '../services/aiDiagnosticService'
import type { SaveReportError } from '../services/reportsService'
import type { AIDiagnosis, Telemetry } from '../types/diagnosis'
import { createStrictContext } from './createStrictContext'

/**
 * - offline: el servicio local no responde (no está en ejecución, otro puerto o CORS).
 * - timeout: el servicio tardó demasiado.
 * - serverError: el servicio respondió con un error.
 */
export type DiagnosisError = 'offline' | 'timeout' | 'serverError' | null

/** Disponibilidad del servicio local (server.py), comprobada con GET /health. */
export type ServiceStatus = 'checking' | 'online' | 'offline'

/** Etapa en curso del análisis automático; `null` cuando no hay análisis en marcha. */
export type AnalysisStage = 'telemetry' | 'ai' | 'saving' | null

export type SaveState =
  | { status: 'idle' }
  | { status: 'saved'; reportId: string }
  | { status: 'skipped' }
  | { status: 'error'; error: SaveReportError }

export interface DiagnosisContextValue {
  /** Última telemetría capturada (o el último diagnóstico guardado en disco). */
  telemetry: Telemetry | null
  /** Diagnóstico a mostrar: el de la IA si existe; si no, el del motor de reglas en el idioma activo. */
  diagnosis: AIDiagnosis | null
  /** Motivo por el que se usa el motor de reglas tras un análisis; `null` si respondió la IA. */
  aiFailure: AIFailureReason | null
  stage: AnalysisStage
  isAnalyzing: boolean
  saveState: SaveState
  error: DiagnosisError
  lastScanAt: Date | null
  analyze: () => void
  dismissError: () => void
}

export const [DiagnosisContext, useDiagnosis] = createStrictContext<DiagnosisContextValue>('Diagnosis')
