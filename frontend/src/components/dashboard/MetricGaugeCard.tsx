import type { ReactNode } from 'react'
import { useI18n } from '../../context/I18nContext'
import { getLevel } from '../../services/healthService'
import type { MetricKind } from '../../types/diagnosis'
import type { TranslationKey } from '../../types/i18n'
import { Gauge } from '../ui/Gauge'
import { Icon, type IconName } from '../ui/Icon'
import { LEVEL_STYLES } from '../ui/levelStyles'

const META: Readonly<Record<MetricKind, { icon: IconName; title: TranslationKey; detail: TranslationKey }>> = {
  cpu: { icon: 'cpu', title: 'dashboard.metrics.cpu', detail: 'dashboard.metrics.cpuDetail' },
  ram: { icon: 'memory', title: 'dashboard.metrics.ram', detail: 'dashboard.metrics.ramDetail' },
  disk: { icon: 'disk', title: 'dashboard.metrics.disk', detail: 'dashboard.metrics.diskDetail' },
}

interface MetricGaugeCardProps {
  kind: MetricKind
  value: number | null
  footer?: ReactNode
  className?: string
}

export function MetricGaugeCard({ kind, value, footer, className = '' }: MetricGaugeCardProps) {
  const { t, formatNumber } = useI18n()
  const meta = META[kind]
  const level = value === null ? 'ok' : getLevel(kind, value)
  const styles = LEVEL_STYLES[level]
  const display = value === null ? '—' : formatNumber(value, { maximumFractionDigits: 1 })

  return (
    <article className={`card flex flex-col gap-3 p-5 ${className}`}>
      <header className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
          <Icon name={meta.icon} className="size-4" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-display text-[0.95rem] leading-tight font-semibold tracking-tight text-ink">
            {t(meta.title)}
          </h3>
          {value !== null && (
            <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.7rem] font-bold ${styles.soft}`}>
              <span className={`size-1.5 rounded-full ${styles.dot}`} />
              {t(`dashboard.levels.${level}`)}
            </span>
          )}
        </div>
      </header>

      <Gauge value={value} level={level} display={display} unit="%" label={t(meta.title)} />

      <div className="mt-auto border-t border-line pt-3 text-xs text-muted">
        {footer ?? <p>{value === null ? t('dashboard.metrics.noData') : t(meta.detail)}</p>}
      </div>
    </article>
  )
}
