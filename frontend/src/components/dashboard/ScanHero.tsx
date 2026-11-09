import { useDiagnosis, type AnalysisStage } from '../../context/DiagnosisContext'
import { useI18n } from '../../context/I18nContext'
import { Icon } from '../ui/Icon'
import { Spinner } from '../ui/Spinner'

const STEPS = ['telemetry', 'ai', 'saving'] as const satisfies readonly NonNullable<AnalysisStage>[]

/** Tarjeta principal con el botón de análisis automático y el progreso por etapas. */
export function ScanHero({ deep = false }: { deep?: boolean }) {
  const { telemetry, deepScan, stage, isAnalyzing, analyze, startDeepScan } = useDiagnosis()
  const { t } = useI18n()
  const hasResult = deep ? deepScan !== null : telemetry !== null
  const copy = deep
    ? { title: 'analysis.scan.readyTitle', description: 'analysis.scan.readyDescription', start: 'analysis.scan.start', again: 'analysis.scan.again' } as const
    : { title: 'dashboard.scan.readyTitle', description: 'dashboard.scan.readyDescription', start: 'dashboard.scan.start', again: 'dashboard.scan.again' } as const
  const current = stage ? STEPS.indexOf(stage) : -1

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
          {t(copy.title)}
        </div>

        {stage ? (
          <ol aria-label={t('dashboard.scan.stepsLabel')} className="flex flex-wrap items-center justify-center gap-2">
            {STEPS.map((step, index) => {
              const done = index < current
              const active = index === current
              return (
                <li key={step} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden="true" className={`h-px w-6 ${done || active ? 'bg-brand' : 'bg-line'}`} />}
                  <span
                    aria-current={active ? 'step' : undefined}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                      active
                        ? 'bg-brand text-white'
                        : done
                          ? 'bg-brand-soft text-brand-strong'
                          : 'bg-surface-sunken text-muted'
                    }`}
                  >
                    {done ? <Icon name="check" className="size-3" strokeWidth={2.6} /> : active ? <Spinner className="size-3" /> : null}
                    {t(`dashboard.scan.steps.${step}`)}
                  </span>
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="max-w-md text-sm leading-relaxed text-ink-soft">{t(copy.description)}</p>
        )}

        <p role="status" className="sr-only">
          {stage ? t(`dashboard.scan.stages.${stage}`) : ''}
        </p>

        <button type="button" onClick={deep ? startDeepScan : analyze} disabled={isAnalyzing} className="btn-primary min-w-64 py-3.5 tracking-wide uppercase">
          {isAnalyzing ? <Spinner /> : <Icon name={hasResult ? 'refresh' : 'search'} className="size-4" />}
          {stage
            ? t(`dashboard.scan.stages.${stage}`)
            : t(hasResult ? copy.again : copy.start)}
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
