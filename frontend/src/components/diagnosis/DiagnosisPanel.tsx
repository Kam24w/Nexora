import { useDiagnosis, type SaveState } from '../../context/DiagnosisContext'
import { useI18n } from '../../context/I18nContext'
import { getHealthScore } from '../../services/healthService'
import type { AIDiagnosis, SystemStatus } from '../../types/diagnosis'
import { Icon } from '../ui/Icon'
import { LogoMark } from '../ui/LogoMark'
import { LEVEL_STYLES, STATUS_LEVEL } from '../ui/levelStyles'
import { METRIC_ICON } from '../ui/metricIcons'
import { FindingCard } from './FindingCard'
import { HealthSummary } from './HealthSummary'
import { SolutionCard } from './SolutionCard'

/** Columna derecha: "¿Por qué está lento?" — causa probable y soluciones accionables. */
export function DiagnosisPanel() {
  const { telemetry, diagnosis, aiFailure, saveState, isAnalyzing } = useDiagnosis()
  const { t, language } = useI18n()

  return (
    <aside
      aria-busy={isAnalyzing}
      className="card flex min-w-0 flex-col gap-5 p-5 xl:sticky xl:top-5 xl:max-h-[calc(100vh-2.5rem)] xl:overflow-y-auto"
    >
      <header>
        <p className="eyebrow">{t('diagnosis.eyebrow')}</p>
        <h2 className="mt-1.5 font-display text-2xl leading-tight font-bold tracking-[-0.035em] text-ink">
          {t('diagnosis.title')}
        </h2>
        <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-brand-strong">{t('diagnosis.subtitle')}</p>
          {diagnosis && <SourceBadge diagnosis={diagnosis} />}
        </div>
      </header>

      {!diagnosis || !telemetry ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-line p-8 text-center">
          <div className="grid size-16 place-items-center rounded-2xl bg-brand-soft">
            <LogoMark className="size-10" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-ink">{t('diagnosis.empty.title')}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{t('diagnosis.empty.description')}</p>
          </div>
        </div>
      ) : (
        <div className={`flex flex-col gap-5 transition-opacity ${isAnalyzing ? 'opacity-50' : ''}`}>
          <StatusPill status={diagnosis.status} />

          {aiFailure && (
            <p className="flex items-start gap-2 rounded-xl bg-warn-soft p-3 text-xs leading-relaxed text-warn">
              <Icon name="alert" className="mt-px size-4" />
              {t(`diagnosis.aiNotice.${aiFailure}`)}
            </p>
          )}

          {diagnosis.source === 'ai' && diagnosis.language !== language && (
            <p className="rounded-xl bg-surface-muted p-3 text-xs leading-relaxed text-ink-soft">
              {t('diagnosis.languageMismatch', {
                language: t(`languages.${diagnosis.language}`),
                current: t(`languages.${language}`),
              })}
            </p>
          )}

          <p className="text-sm leading-relaxed text-ink-soft">{diagnosis.summary}</p>

          <section
            aria-labelledby="cause-title"
            className="relative overflow-hidden rounded-2xl border border-brand/25 bg-linear-to-br from-brand-soft to-surface p-4"
          >
            <div className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-[0_8px_18px_-8px_rgb(12_156_162/0.7)]">
                <Icon name={METRIC_ICON[diagnosis.probableCause.metric]} className="size-5" />
              </span>
              <div className="min-w-0">
                <p id="cause-title" className="eyebrow text-brand-strong">
                  {t('diagnosis.probableCause')}
                </p>
                <h3 className="mt-1 font-display text-base leading-snug font-semibold break-words text-ink">
                  {diagnosis.probableCause.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed break-words text-ink-soft">
                  {diagnosis.probableCause.explanation}
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="findings-title">
            <h3 id="findings-title" className="eyebrow mb-2.5">
              {t('diagnosis.findings.title')}
            </h3>
            {diagnosis.findings.length ? (
              <ul className="flex flex-col gap-2.5">
                {diagnosis.findings.map((finding, index) => (
                  <FindingCard key={`${index}-${finding.title}`} finding={finding} />
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-ok-soft p-3.5 text-sm text-ok">{t('diagnosis.findings.empty')}</p>
            )}
          </section>

          <section aria-labelledby="solutions-title">
            <h3 id="solutions-title" className="eyebrow mb-2.5">
              {t('diagnosis.solutions.title')}
            </h3>
            {diagnosis.solutions.length ? (
              <ol className="flex flex-col gap-2">
                {diagnosis.solutions.map((solution, index) => (
                  <SolutionCard key={`${index}-${solution.title}`} solution={solution} />
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">{t('diagnosis.solutions.empty')}</p>
            )}
          </section>

          <HealthSummary score={getHealthScore(telemetry)} status={diagnosis.status} level={STATUS_LEVEL[diagnosis.status]} />

          <SaveStatus state={saveState} />
        </div>
      )}
    </aside>
  )
}

function SourceBadge({ diagnosis }: { diagnosis: AIDiagnosis }) {
  const { t } = useI18n()
  const isAI = diagnosis.source === 'ai'
  return (
    <span
      title={diagnosis.model ?? undefined}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-bold whitespace-nowrap ${
        isAI ? 'bg-brand-soft text-brand-strong' : 'bg-surface-sunken text-muted'
      }`}
    >
      <Icon name={isAI ? 'sparkles' : 'dashboard'} className="size-3" />
      {isAI ? t('diagnosis.source.ai', { model: diagnosis.model ?? 'Claude' }) : t('diagnosis.source.rules')}
    </span>
  )
}

function StatusPill({ status }: { status: SystemStatus }) {
  const { t } = useI18n()
  const styles = LEVEL_STYLES[STATUS_LEVEL[status]]
  return (
    <div className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${styles.soft}`}>
      <span className="relative flex size-2.5">
        <span className={`absolute inset-0 animate-ping rounded-full opacity-60 ${styles.dot}`} />
        <span className={`relative size-2.5 rounded-full ${styles.dot}`} />
      </span>
      {t(`diagnosis.status.${status}.label`)}
    </div>
  )
}

function SaveStatus({ state }: { state: SaveState }) {
  const { t } = useI18n()
  if (state.status === 'idle') return null

  const content = {
    saved: { icon: 'cloud', className: 'text-ok', text: t('diagnosis.save.saved') },
    skipped: { icon: 'cloud', className: 'text-muted', text: t('diagnosis.save.skipped') },
    error: {
      icon: 'alert',
      className: 'text-crit',
      text: t(state.status === 'error' && state.error === 'unauthorized' ? 'diagnosis.save.unauthorized' : 'diagnosis.save.error'),
    },
  } as const

  const { icon, className, text } = content[state.status]
  return (
    <p role="status" className={`flex items-center justify-center gap-1.5 text-xs font-medium ${className}`}>
      <Icon name={icon} className="size-3.5" />
      {text}
    </p>
  )
}
