import { useMemo } from 'react'
import { useDiagnosis } from '../../context/DiagnosisContext'
import { useI18n } from '../../context/I18nContext'
import { toMessage } from '../../services/diagnosisMessages'
import { getHealthScore } from '../../services/healthService'
import { Icon } from '../ui/Icon'
import { LogoMark } from '../ui/LogoMark'
import { LEVEL_STYLES, STATUS_LEVEL } from '../ui/levelStyles'
import { FindingCard, type Finding } from './FindingCard'
import { HealthSummary } from './HealthSummary'

/** Columna derecha: "¿Por qué está lento?" — causas probables y soluciones. */
export function DiagnosisPanel() {
  const { diagnosis } = useDiagnosis()
  const { t, tm } = useI18n()

  const findings = useMemo<Finding[]>(() => {
    if (!diagnosis) return []
    const level = STATUS_LEVEL[diagnosis.status]
    return [
      ...diagnosis.issues.map((text, i) => ({ id: `issue-${i}`, kind: 'issue' as const, level, message: toMessage(text) })),
      ...diagnosis.causes.map((text, i) => ({ id: `cause-${i}`, kind: 'cause' as const, level: 'warn' as const, message: toMessage(text) })),
    ]
  }, [diagnosis])

  const solutions = useMemo(() => diagnosis?.recommendations.map(toMessage) ?? [], [diagnosis])

  return (
    <aside className="card flex min-w-0 flex-col gap-5 p-5 xl:sticky xl:top-5 xl:max-h-[calc(100vh-2.5rem)] xl:overflow-y-auto">
      <header>
        <p className="eyebrow">{t('diagnosis.eyebrow')}</p>
        <h2 className="mt-1.5 font-display text-2xl leading-tight font-bold tracking-[-0.035em] text-ink">
          {t('diagnosis.title')}
        </h2>
        <p className="text-sm font-medium text-brand-strong">{t('diagnosis.subtitle')}</p>
      </header>

      {!diagnosis ? (
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
        <>
          <StatusPill status={diagnosis.status} />

          <section aria-labelledby="findings-title">
            <h3 id="findings-title" className="eyebrow mb-2.5">
              {t('diagnosis.findings.title')}
            </h3>
            {findings.length ? (
              <ul className="flex flex-col gap-2.5">
                {findings.map((finding) => (
                  <FindingCard key={finding.id} finding={finding} />
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
            {solutions.length ? (
              <ol className="flex flex-col gap-2">
                {solutions.map((solution, index) => (
                  <li key={index} className="flex gap-3 rounded-xl bg-surface-muted p-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-md bg-brand text-white">
                      <Icon name="check" className="size-3.5" strokeWidth={2.4} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.62rem] font-bold tracking-wider text-muted uppercase">
                        {t('diagnosis.solutions.step', { n: index + 1 })}
                      </p>
                      <p className="text-sm leading-snug text-ink-soft">{tm(solution)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">{t('diagnosis.solutions.empty')}</p>
            )}
          </section>

          <div className="mt-auto">
            <HealthSummary score={getHealthScore(diagnosis)} status={diagnosis.status} level={STATUS_LEVEL[diagnosis.status]} />
          </div>
        </>
      )}
    </aside>
  )
}

function StatusPill({ status }: { status: keyof typeof STATUS_LEVEL }) {
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
