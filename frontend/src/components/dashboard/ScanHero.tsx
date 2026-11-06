import { useDiagnosis } from '../../context/DiagnosisContext'
import { useI18n } from '../../context/I18nContext'
import { Icon } from '../ui/Icon'
import { Spinner } from '../ui/Spinner'

/** Tarjeta principal con el botón de análisis automático. */
export function ScanHero() {
  const { diagnosis, isAnalyzing, analyze } = useDiagnosis()
  const { t } = useI18n()

  return (
    <section
      aria-busy={isAnalyzing}
      className="relative overflow-hidden rounded-2xl border border-brand/25 bg-linear-to-br from-brand-soft via-surface to-surface p-6 shadow-card sm:p-7"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-brand/15 blur-3xl"
      />
      <div className="relative flex flex-col items-center gap-5 text-center">
        <div className="flex items-center gap-2 rounded-full bg-surface/80 px-3 py-1 text-xs font-semibold text-brand-strong ring-1 ring-brand/20">
          <Icon name="sparkles" className="size-3.5" />
          {t(isAnalyzing ? 'dashboard.scan.running' : 'dashboard.scan.readyTitle')}
        </div>
        <p className="max-w-md text-sm leading-relaxed text-ink-soft">
          {t(isAnalyzing ? 'dashboard.scan.runningHint' : 'dashboard.scan.readyDescription')}
        </p>
        <button type="button" onClick={analyze} disabled={isAnalyzing} className="btn-primary min-w-64 py-3.5 tracking-wide uppercase">
          {isAnalyzing ? <Spinner /> : <Icon name={diagnosis ? 'refresh' : 'search'} className="size-4" />}
          {t(isAnalyzing ? 'dashboard.scan.running' : diagnosis ? 'dashboard.scan.again' : 'dashboard.scan.start')}
        </button>
      </div>
      {isAnalyzing && (
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-brand/10">
          <div className="h-full w-1/3 animate-scan rounded-full bg-brand" />
        </div>
      )}
    </section>
  )
}
