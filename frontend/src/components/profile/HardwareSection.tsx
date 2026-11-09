import { useI18n } from '../../context/I18nContext'
import { useHardwareProfile } from '../../hooks/useHardwareProfile'
import { HardwareList } from '../hardware/HardwareList'
import { Icon } from '../ui/Icon'

/** Componentes reales del equipo donde corre Nexora, detectados por el colector de Python. */
export function HardwareSection() {
  const { t } = useI18n()
  const { state, retry } = useHardwareProfile()

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
        <div role="status" className="grid gap-3 sm:grid-cols-2">
          <span className="sr-only">{t('profile.hardware.loading')}</span>
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="skeleton h-20" />
          ))}
        </div>
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

      {state.status === 'ready' && <HardwareList hardware={state.hardware} />}
    </section>
  )
}

