import { useDiagnosis } from '../../context/DiagnosisContext'
import { useI18n } from '../../context/I18nContext'
import type { TranslationKey } from '../../types/i18n'
import type { ScanType } from '../../types/scan'
import { ScanProgress } from '../scan/ScanProgress'
import { Icon } from '../ui/Icon'
import { Spinner } from '../ui/Spinner'

const FEATURES: Readonly<Record<ScanType, readonly TranslationKey[]>> = {
  basic: ['scan.features.basic.metrics', 'scan.features.basic.processes', 'scan.features.basic.ai'],
  advanced: [
    'scan.features.advanced.inventory',
    'scan.features.advanced.monitor',
    'scan.features.advanced.hardware',
    'scan.features.advanced.ai',
  ],
}

/**
 * Tarjeta de un tipo de análisis: qué incluye y cuánto tarda en reposo, y el progreso
 * paso a paso mientras se ejecuta. Solo puede haber un análisis a la vez.
 */
export function ScanHero({ type = 'basic' }: { type?: ScanType }) {
  const { telemetry, deepScan, progress, isAnalyzing, analyze, startDeepScan } = useDiagnosis()
  const { t } = useI18n()
  const advanced = type === 'advanced'
  const hasResult = advanced ? deepScan !== null : telemetry !== null
  const runningHere = progress?.type === type
  const runningOther = progress !== null && !runningHere

  return (
    <section
      aria-busy={isAnalyzing}
      aria-label={t(`scan.types.${type}`)}
      className={`relative overflow-hidden rounded-2xl border p-6 shadow-card sm:p-7 ${
        advanced ? 'border-brand/40 bg-linear-to-br from-brand-soft via-brand-soft/40 to-surface' : 'border-brand/25 bg-linear-to-br from-brand-soft via-surface to-surface'
      }`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-brand/15 blur-3xl" />
      <div className="relative flex flex-col items-center gap-5 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="flex items-center gap-2 rounded-full bg-surface/80 px-3 py-1 text-xs font-semibold text-brand-strong ring-1 ring-brand/20">
            <Icon name={advanced ? 'analysis' : 'sparkles'} className="size-3.5" />
            {t(`scan.types.${type}`)}
          </span>
          <span className="rounded-full bg-surface/80 px-2.5 py-1 text-xs font-medium text-ink-soft ring-1 ring-line">
            {t(`scan.durations.${type}`)}
          </span>
        </div>

        {runningHere && progress ? (
          <ScanProgress progress={progress} />
        ) : (
          <>
            <p className="max-w-md text-sm leading-relaxed text-ink-soft">{t(`scan.descriptions.${type}`)}</p>
            <ul aria-label={t('scan.includes')} className="flex flex-wrap justify-center gap-2">
              {FEATURES[type].map((feature) => (
                <li key={feature} className="flex items-center gap-1.5 rounded-lg bg-surface/80 px-2.5 py-1 text-xs text-ink-soft ring-1 ring-line">
                  <Icon name="check" className="size-3 text-ok" strokeWidth={2.6} />
                  {t(feature)}
                </li>
              ))}
            </ul>
          </>
        )}

        {runningOther && progress && (
          <p role="status" className="rounded-lg bg-surface/80 px-3 py-2 text-xs text-ink-soft ring-1 ring-line">
            {t('scan.otherRunning', { type: t(`scan.types.${progress.type}`).toLowerCase() })}
          </p>
        )}

        <button
          type="button"
          onClick={advanced ? startDeepScan : analyze}
          disabled={isAnalyzing}
          className="btn-primary min-w-64 py-3.5 tracking-wide uppercase"
        >
          {isAnalyzing ? <Spinner /> : <Icon name={hasResult ? 'refresh' : 'search'} className="size-4" />}
          {runningHere ? t('scan.running', { type: t(`scan.types.${type}`) }) : t(hasResult ? `scan.again.${type}` : `scan.start.${type}`)}
        </button>

        {!advanced && !isAnalyzing && (
          <p className="text-xs text-ink-soft">
            {t('scan.needMore')}{' '}
            <a href="#analysis" className="font-semibold text-brand-strong underline-offset-2 hover:underline">
              {t('scan.goAdvanced')}
            </a>
          </p>
        )}
      </div>
    </section>
  )
}
