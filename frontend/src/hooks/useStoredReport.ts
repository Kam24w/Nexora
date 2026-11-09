import { useCallback, useEffect, useState } from 'react'
import { reportsService, type GetReportResult, type StoredReport } from '../services/reportsService'

export type StoredReportState =
  | { status: 'loading' }
  | { status: 'ready'; report: StoredReport }
  | { status: 'error'; error: Extract<GetReportResult, { ok: false }>['error'] }

/** Carga un informe guardado por su id (vista dedicada del chat). */
export function useStoredReport(reportId: string) {
  const [state, setState] = useState<StoredReportState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    reportsService.get(reportId).then((result) => {
      if (active) setState(result.ok ? { status: 'ready', report: result.report } : { status: 'error', error: result.error })
    })
    return () => {
      active = false
    }
  }, [reportId, attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [])

  return { state, retry }
}
