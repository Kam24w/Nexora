import { useI18n } from '../../context/I18nContext'
import { getTemperatureLevel } from '../../services/healthService'
import { Icon } from '../ui/Icon'
import { LEVEL_STYLES } from '../ui/levelStyles'

/** Temperatura del sistema; muestra "No disponible" si el sistema operativo no expone sensores. */
export function TemperatureReading({ celsius }: { celsius: number | null }) {
  const { t, formatNumber } = useI18n()
  const styles = celsius === null ? null : LEVEL_STYLES[getTemperatureLevel(celsius)]

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5">
        <Icon name="thermometer" className="size-3.5" />
        {t('dashboard.metrics.temperature')}
      </span>
      {celsius === null || !styles ? (
        <span className="text-muted">{t('dashboard.metrics.temperatureUnavailable')}</span>
      ) : (
        <span className={`font-display text-sm font-semibold tabular-nums ${styles.text}`}>
          {t('common.celsius', { value: formatNumber(celsius, { maximumFractionDigits: 1 }) })}
        </span>
      )}
    </div>
  )
}
