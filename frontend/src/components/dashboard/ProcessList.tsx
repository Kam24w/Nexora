import { useMemo } from 'react'
import { useI18n } from '../../context/I18nContext'
import { getTopProcesses } from '../../services/healthService'
import type { ProcessSample } from '../../types/diagnosis'

export function ProcessList({ processes }: { processes: ProcessSample[] }) {
  const { t, formatNumber } = useI18n()
  const top = useMemo(() => getTopProcesses(processes), [processes])
  const maxCpu = Math.max(100, ...top.map((p) => p.cpu))
  const pct = (value: number) => formatNumber(value / 100, { style: 'percent', maximumFractionDigits: 1 })

  return (
    <section className="card p-5">
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t('dashboard.processes.subtitle')}</p>
          <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">{t('dashboard.processes.title')}</h2>
        </div>
        <span className="flex items-center gap-1.5 text-[0.65rem] font-bold tracking-widest text-ok uppercase">
          <span className="size-1.5 animate-pulse rounded-full bg-ok" />
          {t('dashboard.processes.live')}
        </span>
      </header>

      {top.length === 0 ? (
        <p className="rounded-xl bg-surface-muted p-4 text-sm text-muted">{t('dashboard.processes.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-left text-[0.65rem] font-bold tracking-wider text-muted uppercase">
                <th className="pb-2 font-bold">{t('dashboard.processes.name')}</th>
                <th className="pb-2 font-bold">{t('dashboard.processes.pid')}</th>
                <th className="w-[38%] pb-2 font-bold">{t('dashboard.processes.cpu')}</th>
                <th className="pb-2 text-right font-bold">{t('dashboard.processes.memory')}</th>
              </tr>
            </thead>
            <tbody>
              {top.map((process) => (
                <tr key={process.pid} className="border-t border-line">
                  <td className="max-w-[180px] truncate py-2.5 pr-3 font-semibold text-ink" title={process.name}>
                    {process.name}
                  </td>
                  <td className="py-2.5 pr-3 text-muted tabular-nums">{process.pid}</td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-brand to-warn"
                          style={{ width: `${(process.cpu / maxCpu) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs font-semibold text-ink-soft tabular-nums">{pct(process.cpu)}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-xs text-ink-soft tabular-nums">{pct(process.memory)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
