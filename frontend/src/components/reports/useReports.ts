import { useCallback, useEffect, useState } from 'react'
import { reportsService, type StoredReport } from '../../services/reportsService'
import type { SaveReportError } from '../../services/reportsService'

export type ReportsState =
  | { status: 'disabled' }
  | { status: 'loading' }
  | { status: 'ready'; reports: StoredReport[] }
  | { status: 'error'; error: SaveReportError }

/**
 * Informes del usuario en Supabase. `enabled` es false sin sesión (modo local):
 * entonces no se consulta nada.
 */
export function useReports(enabled: boolean) {
  const [state, setState] = useState<ReportsState>(enabled ? { status: 'loading' } : { status: 'disabled' })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let active = true
    reportsService.list().then((result) => {
      if (!active) return
      setState(result.ok ? { status: 'ready', reports: result.reports } : { status: 'error', error: result.error })
    })
    return () => {
      active = false
    }
  }, [enabled, version])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setVersion((current) => current + 1)
  }, [])

  /** Borra un informe; si funciona, lo quita de la lista sin volver a consultar. */
  const remove = useCallback(async (id: string): Promise<boolean> => {
    const result = await reportsService.remove(id)
    if (result.ok) {
      setState((current) =>
        current.status === 'ready' ? { status: 'ready', reports: current.reports.filter((r) => r.id !== id) } : current,
      )
    }
    return result.ok
  }, [])

  return { state, reload, remove }
}
