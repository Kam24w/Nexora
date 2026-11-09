import { useDiagnosis } from '../../context/DiagnosisContext'
import { useI18n } from '../../context/I18nContext'
import { useNow } from '../../hooks/useNow'
import { MetricGaugeCard } from './MetricGaugeCard'
import { ProcessList } from './ProcessList'
import { ScanErrorAlert } from './ScanErrorAlert'
import { ScanHero } from './ScanHero'
import { ServiceStatusBanner } from './ServiceStatusBanner'
import { TemperatureReading } from './TemperatureReading'

/** Columna central: telemetría y botón de análisis. */
export function TelemetryPanel() {
  const { telemetry, lastScanAt } = useDiagnosis()
  const { t, formatNumber, formatRelativeTime } = useI18n()
  // Refresca el texto relativo ("hace 2 minutos").
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
          {lastScanAt ? t('dashboard.lastScan', { time: formatRelativeTime(lastScanAt) }) : t('dashboard.noScanYet')}
        </p>
      </header>

      <ScanHero />

      <ServiceStatusBanner />

      <ScanErrorAlert />

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
