import { useDiagnosis } from '../../context/DiagnosisContext'
import { useI18n } from '../../context/I18nContext'
import { Icon } from '../ui/Icon'

/** Error del último análisis. El caso "offline" lo cubre ServiceStatusBanner. */
export function ScanErrorAlert() {
  const { error, dismissError } = useDiagnosis()
  const { t } = useI18n()
  if (!error || error === 'offline') return null

  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-crit/30 bg-crit-soft p-4 text-sm text-crit">
      <Icon name="alert" className="mt-0.5 size-4" />
      <p className="flex-1">{t(`dashboard.errors.${error}`)}</p>
      <button type="button" onClick={dismissError} aria-label={t('dashboard.errors.dismiss')} className="rounded-md p-0.5 hover:bg-crit/10">
        <Icon name="close" className="size-4" />
      </button>
    </div>
  )
}
