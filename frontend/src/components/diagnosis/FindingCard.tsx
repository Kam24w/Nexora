import type { DiagnosisFinding } from '../../types/diagnosis'
import { Icon } from '../ui/Icon'
import { LEVEL_STYLES } from '../ui/levelStyles'
import { METRIC_ICON } from '../ui/metricIcons'

export function FindingCard({ finding }: { finding: DiagnosisFinding }) {
  const styles = LEVEL_STYLES[finding.severity]

  return (
    <li className="flex animate-fade-in gap-3 rounded-xl border border-line bg-surface p-3.5">
      <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${styles.soft}`}>
        <Icon name={METRIC_ICON[finding.metric]} className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm leading-snug font-semibold break-words text-ink">{finding.title}</p>
        {finding.detail && <p className="mt-0.5 text-xs leading-relaxed break-words text-ink-soft">{finding.detail}</p>}
      </div>
    </li>
  )
}
