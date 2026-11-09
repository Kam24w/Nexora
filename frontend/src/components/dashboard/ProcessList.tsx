import { useMemo } from 'react'
import { useI18n } from '../../context/I18nContext'
import { getHighlightedProcesses } from '../../services/healthService'
import type { ProcessSample } from '../../types/diagnosis'
import { ProcessTable } from './ProcessTable'

export function ProcessList({ processes }: { processes: ProcessSample[] }) {
  const { t } = useI18n()
  const top = useMemo(() => getHighlightedProcesses(processes), [processes])

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
        <ProcessTable processes={top} />
      )}
    </section>
  )
}
