import { useDiagnosis } from '../../context/DiagnosisContext'
import { useI18n } from '../../context/I18nContext'
import { API_BASE_URL } from '../../services/apiClient'
import { Icon } from '../ui/Icon'

/** Aviso persistente cuando el servicio local (server.py) no responde en API_BASE_URL. */
export function ServiceStatusBanner() {
  const { serviceStatus, recheckService } = useDiagnosis()
  const { t } = useI18n()

  if (serviceStatus !== 'offline') return null

  return (
    <div role="alert" className="flex flex-col gap-3 rounded-xl border border-crit/30 bg-crit-soft p-4 text-sm sm:flex-row sm:items-center">
      <Icon name="alert" className="size-5 text-crit max-sm:hidden" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-crit">
          {t('dashboard.errors.offline', { url: API_BASE_URL })}
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          {t('dashboard.errors.offlineHint')}{' '}
          <code className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-[0.7rem] text-ink ring-1 ring-line">
            python server.py
          </code>
        </p>
        <p className="mt-1 text-xs text-muted">{t('dashboard.errors.autoRetry')}</p>
      </div>
      <button
        type="button"
        onClick={recheckService}
        className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-crit/30 bg-surface px-3 py-2 text-xs font-semibold text-crit transition hover:bg-crit/10"
      >
        <Icon name="refresh" className="size-3.5" />
        {t('dashboard.errors.retry')}
      </button>
    </div>
  )
}
