import { useEffect, useState } from 'react'
import { useDiagnosis } from '../../context/DiagnosisContext'
import { useI18n } from '../../context/I18nContext'
import { Icon } from '../ui/Icon'
import { MetricGaugeCard } from './MetricGaugeCard'
import { ProcessList } from './ProcessList'
import { ScanHero } from './ScanHero'
import { ServiceStatusBanner } from './ServiceStatusBanner'
import { TemperatureReading } from './TemperatureReading'

/** Refresca el texto relativo ("hace 2 minutos") cada 30 s. */
function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

/** Columna central: telemetría y botón de análisis. */
export function TelemetryPanel() {
  const { telemetry, error, lastScanAt, dismissError } = useDiagnosis()
  const { t, formatNumber, formatRelativeTime } = useI18n()
  useNow()

  const mbps = (value: number) => t('common.mbps', { value: formatNumber(value, { maximumFractionDigits: 2 }) })

  return (
    <main className="flex min-w-0 flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <p className="eyebrow">{t('dashboard.eyebrow')}</p>
          <h1 className="mt-1 font-display text-[1.75rem] leading-tight font-bold tracking-[-0.04em] text-ink">
            {t('dashboard.title')}
          </h1>
        </div>
        <p className="text-xs text-muted">
          {lastScanAt
            ? t('dashboard.lastScan', { time: formatRelativeTime(lastScanAt) })
            : t(telemetry ? 'dashboard.savedSnapshot' : 'dashboard.noScanYet')}
        </p>
      </header>

      <ScanHero />

      <ServiceStatusBanner />

      {error && error !== 'offline' && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-crit/30 bg-crit-soft p-4 text-sm text-crit">
          <Icon name="alert" className="mt-0.5 size-4" />
          <p className="flex-1">{t(`dashboard.errors.${error}`)}</p>
          <button type="button" onClick={dismissError} aria-label={t('dashboard.errors.dismiss')} className="rounded-md p-0.5 hover:bg-crit/10">
            <Icon name="close" className="size-4" />
          </button>
        </div>
      )}

      <section aria-labelledby="telemetry-title" className="@container">
        <h2 id="telemetry-title" className="eyebrow mb-3 px-1">
          {t('dashboard.metrics.title')}
        </h2>
        <div className="grid gap-4 @lg:grid-cols-2 @2xl:grid-cols-3">
          <MetricGaugeCard
            kind="cpu"
            value={telemetry?.cpu ?? null}
            footer={telemetry ? <TemperatureReading celsius={telemetry.cpu_temperature} /> : undefined}
          />
          <MetricGaugeCard kind="ram" value={telemetry?.ram ?? null} />
          <MetricGaugeCard
            kind="disk"
            className="@lg:col-span-2 @2xl:col-span-1"
            value={telemetry?.disk_space ?? null}
            footer={
              telemetry ? (
                <dl className="grid grid-cols-2 gap-2">
                  <div>
                    <dt>{t('dashboard.metrics.read')}</dt>
                    <dd className="font-semibold text-ink-soft tabular-nums">{mbps(telemetry.disk_read)}</dd>
                  </div>
                  <div>
                    <dt>{t('dashboard.metrics.write')}</dt>
                    <dd className="font-semibold text-ink-soft tabular-nums">{mbps(telemetry.disk_write)}</dd>
                  </div>
                </dl>
              ) : undefined
            }
          />
        </div>
      </section>

      <ProcessList processes={telemetry?.processes ?? []} />
    </main>
  )
}
