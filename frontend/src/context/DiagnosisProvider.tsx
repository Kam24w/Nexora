import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { aiDiagnosticService, type AIFailureReason } from '../services/aiDiagnosticService'
import { telemetryService } from '../services/telemetryService'
import { reportsService } from '../services/reportsService'
import { buildRuleBasedDiagnosis } from '../services/ruleBasedDiagnosis'
import type { AIDiagnosis, Telemetry } from '../types/diagnosis'
import { useAuth } from './AuthContext'
import {
  DiagnosisContext,
  type AnalysisStage,
  type DiagnosisContextValue,
  type DiagnosisError,
  type SaveState,
} from './DiagnosisContext'
import { useI18n } from './I18nContext'

const isAbort = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'

/**
 * Orquesta el análisis automático:
 *   1. telemetría (CPU, RAM, almacenamiento, temperatura, procesos) → servicio local
 *   2. AIDiagnosticService → causa probable + soluciones en el idioma activo
 *      (si falla, motor de reglas localizado)
 *   3. informe → Supabase `diagnostic_reports`
 */
export function DiagnosisProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const { language } = useI18n()
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null)
  const [aiDiagnosis, setAIDiagnosis] = useState<AIDiagnosis | null>(null)
  const [aiFailure, setAIFailure] = useState<AIFailureReason | null>(null)
  const [stage, setStage] = useState<AnalysisStage>(null)
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' })
  const [error, setError] = useState<DiagnosisError>(null)
  const [lastScanAt, setLastScanAt] = useState<Date | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  // Muestra el último diagnóstico guardado en disco mientras no se ejecute uno nuevo.
  useEffect(() => {
    const controller = new AbortController()
    telemetryService.loadLatest(controller.signal).then((latest) => {
      if (latest) setTelemetry((current) => current ?? latest)
    })
    return () => controller.abort()
  }, [])

  useEffect(() => () => controllerRef.current?.abort(), [])

  const accessToken = session?.accessToken
  const userId = session?.user.id

  const analyze = useCallback(async () => {
    if (controllerRef.current) return
    const controller = new AbortController()
    controllerRef.current = controller
    const requestLanguage = language
    const { signal } = controller

    setError(null)
    setAIFailure(null)
    setSaveState({ status: 'idle' })

    try {
      setStage('telemetry')
      const captured = await telemetryService.capture({ signal, accessToken })
      setTelemetry(captured)
      setAIDiagnosis(null)
      setLastScanAt(new Date())

      setStage('ai')
      const ai = await aiDiagnosticService.generate(captured, requestLanguage, signal)
      const result = ai.ok ? ai.diagnosis : buildRuleBasedDiagnosis(captured, requestLanguage)
      if (ai.ok) setAIDiagnosis(ai.diagnosis)
      else setAIFailure(ai.reason)

      if (!userId) {
        setSaveState({ status: 'skipped' })
        return
      }
      setStage('saving')
      const saved = await reportsService.save(userId, captured, result)
      if (signal.aborted) return
      setSaveState(saved.ok ? { status: 'saved', reportId: saved.report.id } : { status: 'error', error: saved.error })
    } catch (reason) {
      if (isAbort(reason) || signal.aborted) return
      setError('unavailable')
      if (import.meta.env.DEV) console.warn('[Nexora] analysis failed', reason)
    } finally {
      controllerRef.current = null
      if (!signal.aborted) setStage(null)
    }
  }, [accessToken, userId, language])

  const dismissError = useCallback(() => setError(null), [])

  // El diagnóstico por reglas se recalcula al cambiar de idioma; el de la IA conserva
  // el idioma en que se generó (la UI lo indica).
  const diagnosis = useMemo(
    () => aiDiagnosis ?? (telemetry ? buildRuleBasedDiagnosis(telemetry, language) : null),
    [aiDiagnosis, telemetry, language],
  )

  const value = useMemo<DiagnosisContextValue>(
    () => ({
      telemetry,
      diagnosis,
      aiFailure,
      stage,
      isAnalyzing: stage !== null,
      saveState,
      error,
      lastScanAt,
      analyze: () => void analyze(),
      dismissError,
    }),
    [telemetry, diagnosis, aiFailure, stage, saveState, error, lastScanAt, analyze, dismissError],
  )

  return <DiagnosisContext.Provider value={value}>{children}</DiagnosisContext.Provider>
}
