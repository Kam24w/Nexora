import { useI18n } from '../../context/I18nContext'
import type { ProcessCategory } from '../../types/diagnosis'
import { Icon, type IconName } from '../ui/Icon'

const STYLES: Readonly<Record<Exclude<ProcessCategory, 'application'>, { className: string; icon: IconName }>> = {
  system: { className: 'bg-ok-soft text-ok', icon: 'check' },
  system_unverified: { className: 'bg-surface-sunken text-muted', icon: 'eye' },
  suspicious: { className: 'bg-warn-soft text-warn', icon: 'alert' },
}

/** Etiqueta del proceso. Las aplicaciones normales no llevan etiqueta para no recargar la tabla. */
export function ProcessBadge({ category }: { category: ProcessCategory }) {
  const { t } = useI18n()
  if (category === 'application') return null
  const { className, icon } = STYLES[category]

  return (
    <span
      title={t(`processes.explain.${category}`)}
      className={`inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.7rem] font-semibold whitespace-nowrap ${className}`}
    >
      <Icon name={icon} className="size-3" />
      {t(`processes.category.${category}`)}
    </span>
  )
}
