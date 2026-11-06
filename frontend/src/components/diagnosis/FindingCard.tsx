import { useI18n } from '../../context/I18nContext'
import type { HealthLevel } from '../../types/diagnosis'
import type { Message } from '../../types/i18n'
import { Icon } from '../ui/Icon'
import { LEVEL_STYLES } from '../ui/levelStyles'

export interface Finding {
  id: string
  kind: 'issue' | 'cause'
  level: HealthLevel
  message: Message
}

export function FindingCard({ finding }: { finding: Finding }) {
  const { t, tm } = useI18n()
  const styles = LEVEL_STYLES[finding.level]

  return (
    <li className="flex animate-fade-in gap-3 rounded-xl border border-line bg-surface p-3.5">
      <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${styles.soft}`}>
        <Icon name={finding.kind === 'issue' ? 'alert' : 'cpu'} className="size-4" />
      </span>
      <div className="min-w-0">
        <p className={`text-[0.65rem] font-bold tracking-wider uppercase ${styles.text}`}>
          {t(`diagnosis.findings.${finding.kind}`)}
        </p>
        <p className="mt-0.5 text-sm leading-snug font-medium break-words text-ink">{tm(finding.message)}</p>
      </div>
    </li>
  )
}
