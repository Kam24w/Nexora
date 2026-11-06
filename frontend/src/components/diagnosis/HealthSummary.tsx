import { useI18n } from '../../context/I18nContext'
import type { HealthLevel, SystemStatus } from '../../types/diagnosis'
import { LEVEL_STYLES } from '../ui/levelStyles'

interface HealthSummaryProps {
  score: number
  status: SystemStatus
  level: HealthLevel
}

const RADIUS = 34
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function HealthSummary({ score, status, level }: HealthSummaryProps) {
  const { t } = useI18n()
  const styles = LEVEL_STYLES[level]

  return (
    <section className="flex items-center gap-4 rounded-2xl bg-surface-muted p-4">
      <div className="relative size-20 shrink-0">
        <svg viewBox="0 0 80 80" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="40" cy="40" r={RADIUS} fill="none" strokeWidth="7" className="stroke-surface-sunken" />
          <circle
            cx="40"
            cy="40"
            r={RADIUS}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - score / 100)}
            className={`${styles.stroke} transition-[stroke-dashoffset] duration-700 ease-out`}
          />
        </svg>
        <span className={`absolute inset-0 grid place-items-center font-display text-xl font-bold tabular-nums ${styles.text}`}>
          {score}
        </span>
      </div>
      <div className="min-w-0">
        <h3 className="font-display text-sm font-semibold text-ink">{t('diagnosis.health.title')}</h3>
        <p className="mt-0.5 text-xs text-muted">
          {t('diagnosis.health.score')}: <strong className={styles.text}>{score}</strong>
          {t('diagnosis.health.outOf')}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{t(`diagnosis.status.${status}.description`)}</p>
      </div>
    </section>
  )
}
