import { useI18n } from '../../context/I18nContext'
import type { StoredReport } from '../../services/reportsService'
import { Icon } from '../ui/Icon'
import { LEVEL_STYLES, STATUS_LEVEL } from '../ui/levelStyles'

interface ReportListItemProps {
  report: StoredReport
  selected: boolean
  onSelect: (id: string) => void
}

export function ReportListItem({ report, selected, onSelect }: ReportListItemProps) {
  const { t, formatDate } = useI18n()
  const { payload } = report
  const styles = LEVEL_STYLES[STATUS_LEVEL[payload.status]]

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(report.id)}
        aria-current={selected ? 'true' : undefined}
        className={`flex w-full flex-col gap-2 rounded-xl border p-3.5 text-left transition ${
          selected ? 'border-brand/50 bg-brand-soft' : 'border-line bg-surface hover:border-brand/30 hover:bg-surface-muted'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
            <span className={`size-2 rounded-full ${styles.dot}`} />
            {formatDate(report.createdAt)}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold tabular-nums ${styles.soft}`}>
            {t('reports.score', { score: payload.health_score })}
          </span>
        </div>
        <p className="line-clamp-2 text-sm leading-snug font-semibold text-ink">
          {payload.probable_cause.title || t(`diagnosis.status.${payload.status}.label`)}
        </p>
        <span className="flex items-center gap-1.5 text-[0.65rem] font-semibold text-muted uppercase">
          <Icon name={payload.source === 'ai' ? 'sparkles' : 'dashboard'} className="size-3" />
          {payload.source === 'ai'
            ? t('diagnosis.source.ai', { model: payload.model ?? 'LLM' })
            : t('diagnosis.source.rules')}{' '}
          · {payload.language}
        </span>
      </button>
    </li>
  )
}
