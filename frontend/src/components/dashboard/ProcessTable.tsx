import { Fragment, useState } from 'react'
import { useI18n } from '../../context/I18nContext'
import type { ProcessSample } from '../../types/diagnosis'
import { Icon } from '../ui/Icon'
import { ProcessBadge } from './ProcessBadge'

/**
 * Tabla de procesos: el nombre técnico siempre es visible y cada fila se despliega
 * para consultar ruta y clasificación. Un desplegable, y no un tooltip flotante,
 * porque funciona con teclado, permite copiar la ruta y no lo recorta el scroll.
 */
export function ProcessTable({ processes }: { processes: ProcessSample[] }) {
  const { t, formatNumber } = useI18n()
  const [expandedPid, setExpandedPid] = useState<number | null>(null)
  const maxCpu = Math.max(100, ...processes.map((process) => process.cpu))
  const pct = (value: number) => formatNumber(value / 100, { style: 'percent', maximumFractionDigits: 1 })

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="text-left text-[0.65rem] font-bold tracking-wider text-muted uppercase">
            <th className="pb-2 font-bold">{t('dashboard.processes.name')}</th>
            <th className="pb-2 font-bold">{t('dashboard.processes.pid')}</th>
            <th className="w-[34%] pb-2 font-bold">{t('dashboard.processes.cpu')}</th>
            <th className="pb-2 text-right font-bold">{t('dashboard.processes.memory')}</th>
            <th className="w-8 pb-2" />
          </tr>
        </thead>
        <tbody>
          {processes.map((process) => {
            const expanded = expandedPid === process.pid
            return (
              <Fragment key={process.pid}>
                <tr className="border-t border-line">
                  <td className="max-w-[240px] py-2.5 pr-3">
                    <p className="truncate font-semibold text-ink" title={process.name}>
                      {process.name}
                    </p>
                    <ProcessBadge category={process.category} />
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
                  <td className="py-2.5 pl-2 text-right">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-label={t(expanded ? 'processes.details.hide' : 'processes.details.show', { name: process.name })}
                      onClick={() => setExpandedPid(expanded ? null : process.pid)}
                      className="rounded-md p-1 text-muted transition hover:bg-surface-muted hover:text-ink"
                    >
                      <Icon name="arrowRight" className={`size-3.5 transition-transform ${expanded ? '-rotate-90' : 'rotate-90'}`} />
                    </button>
                  </td>
                </tr>
                {expanded && (
                  <tr>
                    <td colSpan={5} className="pb-3">
                      <dl className="grid gap-2 rounded-xl bg-surface-muted p-3 text-xs sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-4">
                        <dt className="text-muted">{t('processes.details.technicalName')}</dt>
                        <dd className="font-mono break-all text-ink">{process.name}</dd>
                        <dt className="text-muted">{t('processes.details.path')}</dt>
                        <dd className="font-mono break-all text-ink">{process.path ?? t('processes.details.pathUnavailable')}</dd>
                        <dt className="text-muted">{t('processes.details.classification')}</dt>
                        <dd className="text-ink-soft">{t(`processes.explain.${process.category}`)}</dd>
                      </dl>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
