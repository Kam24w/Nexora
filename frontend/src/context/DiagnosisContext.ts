import type { AIFailureReason } from '../services/aiDiagnosticService'
import type { SaveReportError } from '../services/reportsService'
import type { AIDiagnosis, Telemetry } from '../types/diagnosis'
import type { AnalysisProgress } from '../types/scan'
import { createStrictContext } from './createStrictContext'

/**
 * - offline: el servicio local no responde (no está en ejecución, otro puerto o CORS).
 * - timeout: el servicio tardó demasiado.
 * - serverError: el servicio respondió con un error.
 * - busy: ya hay otro análisis midiendo el equipo.
 */
export type DiagnosisError = 'offline' | 'timeout' | 'serverError' | 'busy' | null

/** Disponibilidad del servicio local (server.py), comprobada con GET /health. */
export type ServiceStatus = 'checking' | 'online' | 'offline'

/** Etapa en curso del análisis automático; `null` cuando no hay análisis en marcha. */
export type AnalysisStage = 'telemetry' | 'ai' | 'saving' | null

export type SaveState =
  | { status: 'idle' }
  | { status: 'saved'; reportId: string }
  | { status: 'skipped' }
  | { status: 'error'; error: SaveReportError; code?: string }

export interface DiagnosisContextValue {
  /** Última telemetría capturada . */
  telemetry: Telemetry | null
  /** Diagnóstico a mostrar: el de la IA si existe; si no, el del motor de reglas en el idioma activo. */
  diagnosis: AIDiagnosis | null
  /** Motivo por el que se usa el motor de reglas tras un análisis; `null` si respondió la IA. */
  aiFailure: AIFailureReason | null
  stage: AnalysisStage
  /** Paso a paso del análisis en curso (escaneo, IA, guardado); `null` si no hay ninguno. */
  progress: AnalysisProgress | null
  isAnalyzing: boolean
  saveState: SaveState
  error: DiagnosisError
  lastScanAt: Date | null
  /** Resultado del último escaneo profundo (inventario completo); no lo reemplaza un análisis normal. */
  deepScan: Telemetry | null
  deepScanAt: Date | null
  serviceStatus: ServiceStatus
  analyze: () => void
  /** Escaneo profundo bajo demanda; sigue el mismo flujo de IA e informe que `analyze`. */
  startDeepScan: () => void
  /** Vuelve a comprobar la conexión con el servicio local. */
  recheckService: () => void
  dismissError: () => void
}

export const [DiagnosisContext, useDiagnosis] = createStrictContext<DiagnosisContextValue>('Diagnosis')
