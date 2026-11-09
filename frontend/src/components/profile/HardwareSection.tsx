import { useEffect, useState } from 'react'
import { useI18n } from '../../context/I18nContext'
import { isAbortError } from '../../services/apiClient'
import { hardwareService } from '../../services/hardwareService'
import type { HardwareProfile } from '../../types/hardware'
import { Icon, type IconName } from '../ui/Icon'
import { Spinner } from '../ui/Spinner'

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; hardware: HardwareProfile }

/** Componentes reales del equipo donde corre Nexora, detectados por el colector de Python. */
export function HardwareSection() {
  const { t, formatNumber } = useI18n()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    hardwareService.get(controller.signal).then(
      (hardware) => setState({ status: 'ready', hardware }),
      (reason) => {
        if (!isAbortError(reason)) setState({ status: 'error' })
      },
    )
    return () => controller.abort()
  }, [attempt])

  const retry = () => {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }

  const gb = (value: number | null) => (value === null ? t('profile.hardware.unknown') : t('common.gb', { value: formatNumber(value, { maximumFractionDigits: 1 }) }))

  return (
    <section aria-busy={state.status === 'loading'} className="card flex flex-col gap-4 p-5">
      <header>
        <h2 className="font-display text-base font-semibold text-ink">{t('profile.hardware.title')}</h2>
        <p className="mt-0.5 text-xs text-muted">
          {state.status === 'ready' && state.hardware.machineName
            ? `${state.hardware.machineName}${state.hardware.operatingSystem ? ` · ${state.hardware.operatingSystem}` : ''}`
            : t('profile.hardware.description')}
        </p>
      </header>

      {state.status === 'loading' && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Spinner className="size-4" />
          {t('profile.hardware.loading')}
        </p>
      )}

      {state.status === 'error' && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-warn-soft p-3 text-sm text-warn">
          <p>{t('profile.hardware.unavailable')}</p>
          <button type="button" onClick={retry} className="flex items-center gap-1.5 text-xs font-semibold hover:underline">
            <Icon name="refresh" className="size-3.5" />
            {t('dashboard.errors.retry')}
          </button>
        </div>
      )}

      {state.status === 'ready' && (
        <dl className="grid gap-3 sm:grid-cols-2">
          <Component icon="cpu" label={t('profile.hardware.cpu')}>
            <p>{state.hardware.cpuModel ?? t('profile.hardware.unknown')}</p>
            {state.hardware.physicalCores !== null && state.hardware.logicalCores !== null && (
              <p className="text-xs font-normal text-muted">
                {t('profile.hardware.cores', { physical: state.hardware.physicalCores, logical: state.hardware.logicalCores })}
              </p>
            )}
          </Component>
          <Component icon="memory" label={t('profile.hardware.ram')}>
            <p>{gb(state.hardware.ramTotalGb)}</p>
          </Component>
          <Component icon="disk" label={t('profile.hardware.storage')}>
            {state.hardware.storage.length === 0 && <p>{t('profile.hardware.unknown')}</p>}
            {state.hardware.storage.map((drive, index) => (
              <p key={`${index}-${drive.model}`}>
                {drive.model ?? t('profile.hardware.systemDrive')} <span className="text-xs font-normal text-muted">· {gb(drive.totalGb)}</span>
              </p>
            ))}
          </Component>
          <Component icon="dashboard" label={t('profile.hardware.gpu')}>
            {state.hardware.gpus.length === 0 && <p>{t('profile.hardware.unknown')}</p>}
            {state.hardware.gpus.map((gpu) => (
              <p key={gpu}>{gpu}</p>
            ))}
          </Component>
        </dl>
      )}
    </section>
  )
}

function Component({ icon, label, children }: { icon: IconName; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl bg-surface-muted p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
        <Icon name={icon} className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="mt-0.5 text-sm font-semibold break-words text-ink">{children}</dd>
      </div>
    </div>
  )
}
