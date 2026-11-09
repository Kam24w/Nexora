import { useMemo } from 'react'
import { useDiagnosis } from '../../context/DiagnosisContext'
import { useI18n } from '../../context/I18nContext'
import { PROCESS_FILTERS, useProcessInventory } from '../../hooks/useProcessInventory'
import { ProcessTable } from '../dashboard/ProcessTable'
import { ScanErrorAlert } from '../dashboard/ScanErrorAlert'
import { ScanHero } from '../dashboard/ScanHero'
import { ServiceStatusBanner } from '../dashboard/ServiceStatusBanner'
import { DiagnosisPanel } from '../diagnosis/DiagnosisPanel'
import { HardwareList } from '../hardware/HardwareList'

/** Vista "Análisis": escaneo profundo bajo demanda con el inventario completo de procesos. */
export function AnalysisView() {
  const { deepScan: result, deepScanAt } = useDiagnosis()
  const { t, formatDate, formatNumber } = useI18n()

  const processes = useMemo(() => result?.processes ?? [], [result])
  const { filter, setFilter, counts, visible } = useProcessInventory(processes)

  return (
    <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]">
      <main className="flex min-w-0 flex-col gap-5">
        <header className="flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <p className="eyebrow">{t('analysis.eyebrow')}</p>
            <h1 className="mt-1 font-display text-[1.75rem] leading-tight font-bold tracking-[-0.04em] text-ink">{t('analysis.title')}</h1>
          </div>
          {deepScanAt && <p className="text-xs text-muted">{formatDate(deepScanAt.toISOString(), { dateStyle: 'medium', timeStyle: 'short' })}</p>}
        </header>

        <ScanHero type="advanced" />
        <ServiceStatusBanner />
        <ScanErrorAlert />

        {result?.hardware && (
          <section className="card flex flex-col gap-4 p-5">
            <header>
              <p className="eyebrow">{t('analysis.hardware.subtitle')}</p>
              <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">{t('analysis.hardware.title')}</h2>
            </header>
            <HardwareList hardware={result.hardware} />
          </section>
        )}

        {result ? (
          <section className="card flex flex-col gap-4 p-5">
            <header>
              <p className="eyebrow">{t('analysis.inventory.subtitle')}</p>
              <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">{t('analysis.inventory.title')}</h2>
            </header>

            {counts.suspicious > 0 ? (
              <p role="status" className="rounded-xl bg-warn-soft p-3 text-sm text-warn">
                {t('analysis.inventory.reviewNeeded', { count: counts.suspicious })}
              </p>
            ) : (
              <p role="status" className="rounded-xl bg-ok-soft p-3 text-sm text-ok">
                {t('analysis.inventory.noneSuspicious')}
              </p>
            )}

            <div role="group" aria-label={t('analysis.inventory.filterLabel')} className="flex flex-wrap gap-2">
              {PROCESS_FILTERS.map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={filter === name}
                  onClick={() => setFilter(name)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    filter === name ? 'bg-brand text-on-accent' : 'bg-surface-muted text-ink-soft hover:text-ink'
                  }`}
                >
                  {t(`analysis.inventory.filters.${name}`)} · <span className="tabular-nums">{formatNumber(counts[name])}</span>
                </button>
              ))}
            </div>

            {visible.length ? (
              <ProcessTable processes={visible} />
            ) : (
              <p className="rounded-xl bg-surface-muted p-4 text-sm text-muted">{t('analysis.inventory.emptyFilter')}</p>
            )}
          </section>
        ) : (
          <p className="card p-5 text-sm text-muted">{t('analysis.inventory.empty')}</p>
        )}
      </main>
      <DiagnosisPanel />
    </div>
  )
}
