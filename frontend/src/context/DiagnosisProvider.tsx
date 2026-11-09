import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { aiDiagnosticService, type AIFailureReason } from '../services/aiDiagnosticService'
import { ApiError, checkServiceHealth, isAbortError } from '../services/apiClient'
import { scanService } from '../services/scanService'
import { advanceProgress, startProgress } from '../services/scanProgress'
import { reportsService } from '../services/reportsService'
import { buildRuleBasedDiagnosis } from '../services/ruleBasedDiagnosis'
import type { AIDiagnosis, Telemetry } from '../types/diagnosis'
import type { AnalysisProgress, ProgressStep } from '../types/scan'
import { useAuth } from './AuthContext'
import {
  DiagnosisContext,
  type AnalysisStage,
  type DiagnosisContextValue,
  type DiagnosisError,
  type SaveState,
  type ServiceStatus,
} from './DiagnosisContext'
import { useI18n } from './I18nContext'

/** Mientras el servicio local no responda, se vuelve a comprobar con esta frecuencia. */
const OFFLINE_RECHECK_MS = 5_000

const ignoreAbort = (reason: unknown) => {
  if (!isAbortError(reason)) throw reason
}

const toDiagnosisError = (reason: unknown): Exclude<DiagnosisError, null> => {
  if (reason instanceof ApiError) {
    if (reason.status === 409) return 'busy'
    return reason.kind === 'http' ? 'serverError' : reason.kind
  }
  return 'serverError'
}

/**
 * Orquesta el análisis automático:
 *   1. telemetría (CPU, RAM, almacenamiento, temperatura, procesos) → escaneo en segundo
 *      plano del servicio local, con el avance de cada paso
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
  const [deepScan, setDeepScan] = useState<Telemetry | null>(null)
  const [deepScanAt, setDeepScanAt] = useState<Date | null>(null)
  const [progress, setProgress] = useState<AnalysisProgress | null>(null)
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>('checking')
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const applyHealth = useCallback((online: boolean) => {
    setServiceStatus(online ? 'online' : 'offline')
    if (online) setError((current) => (current === 'offline' ? null : current))
  }, [])

  const recheckService = useCallback(() => {
    checkServiceHealth().then(applyHealth)
  }, [applyHealth])

  // Comprueba el servicio local al abrir el panel para avisar antes de pulsar "Analizar".
  useEffect(() => {
    const controller = new AbortController()
    checkServiceHealth(controller.signal).then(applyHealth, ignoreAbort)
    return () => controller.abort()
  }, [applyHealth])

  // Sin conexión: reintenta en segundo plano; el aviso desaparece en cuanto arranca server.py.
  useEffect(() => {
    if (serviceStatus !== 'offline') return
    const controller = new AbortController()
    const id = window.setInterval(() => {
      checkServiceHealth(controller.signal).then(applyHealth, ignoreAbort)
    }, OFFLINE_RECHECK_MS)
    return () => {
      window.clearInterval(id)
      controller.abort()
    }
  }, [serviceStatus, applyHealth])

  const userId = session?.user.id

  const runScan = useCallback(async (deep: boolean) => {
    if (controllerRef.current) return
    const controller = new AbortController()
    controllerRef.current = controller
    const requestLanguage = language
    const { signal } = controller

    setError(null)
    setAIFailure(null)
    setSaveState({ status: 'idle' })
    setProgress(startProgress(deep ? 'advanced' : 'basic', Boolean(userId)))
    const reach = (step: ProgressStep, fraction = 0) => setProgress((current) => current && advanceProgress(current, step, fraction))

    try {
      setStage('telemetry')
      const captured = await scanService.run(deep ? 'advanced' : 'basic', {
        signal,
        onProgress: ({ step, stepFraction }) => reach(step, stepFraction),
      })
      setServiceStatus('online')
      setTelemetry(captured)
      setAIDiagnosis(null)
      setLastScanAt(new Date())
      if (deep) {
        setDeepScan(captured)
        setDeepScanAt(new Date())
      }

      setStage('ai')
      reach('ai')
      const ai = await aiDiagnosticService.generate(captured, requestLanguage, signal)
      const result = ai.ok ? ai.diagnosis : buildRuleBasedDiagnosis(captured, requestLanguage)
      if (ai.ok) setAIDiagnosis(ai.diagnosis)
      else setAIFailure(ai.reason)

      if (!userId) {
        setSaveState({ status: 'skipped' })
        return
      }
      setStage('saving')
      reach('saving')
      const saved = await reportsService.save(userId, captured, result)
      if (signal.aborted) return
      setSaveState(saved.ok ? { status: 'saved', reportId: saved.report.id } : { status: 'error', error: saved.error, code: saved.code })
    } catch (reason) {
      if (isAbortError(reason) || signal.aborted) return
      const kind = toDiagnosisError(reason)
      setError(kind)
      if (kind === 'offline') setServiceStatus('offline')
      if (import.meta.env.DEV) console.warn('[Nexora] analysis failed', reason)
    } finally {
      controllerRef.current = null
      if (!signal.aborted) {
        setStage(null)
        setProgress(null)
      }
    }
  }, [userId, language])

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
      progress,
      isAnalyzing: stage !== null,
      saveState,
      error,
      lastScanAt,
      deepScan,
      deepScanAt,
      serviceStatus,
      analyze: () => void runScan(false),
      startDeepScan: () => void runScan(true),
      recheckService,
      dismissError,
    }),
    [telemetry, diagnosis, aiFailure, stage, progress, saveState, error, lastScanAt, deepScan, deepScanAt, serviceStatus, runScan, recheckService, dismissError],
  )

  return <DiagnosisContext.Provider value={value}>{children}</DiagnosisContext.Provider>
}
