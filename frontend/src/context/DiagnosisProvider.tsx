import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { diagnosisService } from '../services/diagnosisService'
import type { Diagnosis } from '../types/diagnosis'
import { useAuth } from './AuthContext'
import { DiagnosisContext, type DiagnosisContextValue, type DiagnosisError } from './DiagnosisContext'

export function DiagnosisProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<DiagnosisError>(null)
  const [lastScanAt, setLastScanAt] = useState<Date | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  // Muestra el último diagnóstico guardado mientras no se ejecute uno nuevo.
  useEffect(() => {
    const controller = new AbortController()
    diagnosisService.loadLatest(controller.signal).then((latest) => {
      if (latest) setDiagnosis((current) => current ?? latest)
    })
    return () => controller.abort()
  }, [])

  useEffect(() => () => controllerRef.current?.abort(), [])

  const accessToken = session?.accessToken
  const analyze = useCallback(() => {
    if (controllerRef.current) return
    const controller = new AbortController()
    controllerRef.current = controller
    setIsAnalyzing(true)
    setError(null)

    diagnosisService
      .run({ signal: controller.signal, accessToken })
      .then((result) => {
        setDiagnosis(result)
        setLastScanAt(new Date())
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError('unavailable')
        if (import.meta.env.DEV) console.warn('[Nexora] diagnosis failed', reason)
      })
      .finally(() => {
        controllerRef.current = null
        if (!controller.signal.aborted) setIsAnalyzing(false)
      })
  }, [accessToken])

  const dismissError = useCallback(() => setError(null), [])

  const value = useMemo<DiagnosisContextValue>(
    () => ({ diagnosis, isAnalyzing, error, lastScanAt, analyze, dismissError }),
    [diagnosis, isAnalyzing, error, lastScanAt, analyze, dismissError],
  )

  return <DiagnosisContext.Provider value={value}>{children}</DiagnosisContext.Provider>
}
