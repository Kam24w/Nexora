import type { StoredReport } from './reportsService'

/** Descarga el informe guardado tal como está en la cuenta del usuario. */
export const downloadReportJson = ({ id, createdAt, payload }: StoredReport): void => {
  const blob = new Blob([JSON.stringify({ id, created_at: createdAt, ...payload }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `nexora-informe-${createdAt.slice(0, 10)}-${id.slice(0, 8)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
