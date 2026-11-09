import { useId, useState } from 'react'
import { useI18n } from '../../context/I18nContext'
import { useReportExport } from '../../hooks/useReportExport'
import type { StoredReport } from '../../services/reportsService'
import { LANGUAGES, type Language } from '../../types/preferences'
import { Icon } from '../ui/Icon'
import { Spinner } from '../ui/Spinner'

/** Idioma del PDF y botón de descarga; traduce con IA cuando el idioma no es el original. */
export function ReportExportControls({ report }: { report: StoredReport }) {
  const { t, language: uiLanguage } = useI18n()
  const [language, setLanguage] = useState<Language>(uiLanguage)
  const { status, exportPdf } = useReportExport(report)
  const hintId = useId()
  const busy = status !== 'idle'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="radiogroup" aria-label={t('reports.export.language')} className="flex items-center gap-0.5 rounded-lg bg-surface-sunken p-0.5">
        {LANGUAGES.map((code) => (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={language === code}
            title={t(`languages.${code}`)}
            disabled={busy}
            onClick={() => setLanguage(code)}
            className={`rounded-md px-2 py-1 text-[0.7rem] font-bold tracking-wider uppercase transition ${
              language === code ? 'bg-surface text-brand-strong shadow-sm' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {code}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => void exportPdf(language)} disabled={busy} aria-describedby={hintId} className="btn-secondary">
        {busy ? <Spinner className="size-3.5" /> : <Icon name="printer" className="size-3.5" />}
        {status === 'translating' ? t('reports.export.translating') : status === 'printing' ? t('reports.export.preparing') : t('reports.export.pdf')}
      </button>
      <span id={hintId} className="sr-only">
        {t('reports.export.hint')}
      </span>
    </div>
  )
}
