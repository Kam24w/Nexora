import { useCallback, useRef, useState } from 'react'
import { useI18n } from '../context/I18nContext'
import { useToast } from '../context/ToastContext'
import { printDocument } from '../services/printDocument'
import { reportAssistantService } from '../services/reportAssistantService'
import { buildReportDocument } from '../services/reportDocument'
import { applyTranslation } from '../services/reportTranslation'
import type { DiagnosticReportPayload, StoredReport } from '../services/reportsService'
import type { Language } from '../types/preferences'

export type ExportStatus = 'idle' | 'translating' | 'printing'

/** Exporta un informe a PDF en el idioma elegido, traduciéndolo con IA si hace falta (con caché). */
export function useReportExport(report: StoredReport) {
  const { t } = useI18n()
  const { notify } = useToast()
  const [status, setStatus] = useState<ExportStatus>('idle')
  const translations = useRef(new Map<Language, DiagnosticReportPayload>())

  const exportPdf = useCallback(
    async (language: Language) => {
      const original = report.payload
      let payload = language === original.language ? original : translations.current.get(language)

      if (!payload) {
        setStatus('translating')
        const result = await reportAssistantService.translate(original, language)
        if (!result.ok) {
          setStatus('idle')
          notify({ kind: 'error', title: t('reports.export.translateFailed'), description: t(`diagnosis.aiNotice.${result.reason}`) })
          return
        }
        payload = applyTranslation(original, result.value)
        translations.current.set(language, payload)
      }

      setStatus('printing')
      const translatedFrom = language === original.language ? undefined : original.language
      await printDocument(buildReportDocument({ ...report, payload }, language, { translatedFrom }))
      setStatus('idle')
    },
    [report, notify, t],
  )

  return { status, exportPdf }
}
