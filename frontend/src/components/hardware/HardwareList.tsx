import type { ReactNode } from 'react'
import { useI18n } from '../../context/I18nContext'
import type { HardwareProfile } from '../../types/hardware'
import { Icon, type IconName } from '../ui/Icon'

/** Procesador, RAM, almacenamiento y gráfica de un perfil de hardware. */
export function HardwareList({ hardware }: { hardware: HardwareProfile }) {
  const { t, formatNumber } = useI18n()
  const gb = (value: number | null) =>
    value === null ? t('profile.hardware.unknown') : t('common.gb', { value: formatNumber(value, { maximumFractionDigits: 1 }) })

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      <Component icon="cpu" label={t('profile.hardware.cpu')}>
        <p>{hardware.cpuModel ?? t('profile.hardware.unknown')}</p>
        {hardware.physicalCores !== null && hardware.logicalCores !== null && (
          <p className="text-xs font-normal text-muted">
            {t('profile.hardware.cores', { physical: hardware.physicalCores, logical: hardware.logicalCores })}
          </p>
        )}
      </Component>
      <Component icon="memory" label={t('profile.hardware.ram')}>
        <p>{gb(hardware.ramTotalGb)}</p>
      </Component>
      <Component icon="disk" label={t('profile.hardware.storage')}>
        {hardware.storage.length === 0 && <p>{t('profile.hardware.unknown')}</p>}
        {hardware.storage.map((drive, index) => (
          <p key={`${index}-${drive.model}`}>
            {drive.model ?? t('profile.hardware.systemDrive')} <span className="text-xs font-normal text-muted">· {gb(drive.totalGb)}</span>
          </p>
        ))}
      </Component>
      <Component icon="dashboard" label={t('profile.hardware.gpu')}>
        {hardware.gpus.length === 0 && <p>{t('profile.hardware.unknown')}</p>}
        {hardware.gpus.map((gpu) => (
          <p key={gpu}>{gpu}</p>
        ))}
      </Component>
    </ul>
  )
}

function Component({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }) {
  return (
    <li className="flex gap-3 rounded-xl bg-surface-muted p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
        <Icon name={icon} className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <div className="mt-0.5 text-sm font-semibold break-words text-ink">{children}</div>
      </div>
    </li>
  )
}
