import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../context/I18nContext'
import type { AppView } from '../../types/navigation'
import { Icon } from '../ui/Icon'
import { LogoMark } from '../ui/LogoMark'
import { Spinner } from '../ui/Spinner'
import { ReportDetail } from './ReportDetail'
import { ReportListItem } from './ReportListItem'
import { useReports } from './useReports'

/** Vista "Informes": historial de diagnósticos guardados en Supabase. */
export function ReportsView({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  const { session } = useAuth()
  const { t } = useI18n()
  const { state, reload, remove } = useReports(Boolean(session))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false)

  const reports = state.status === 'ready' ? state.reports : []
  const selected = reports.find((report) => report.id === selectedId) ?? reports[0] ?? null

  const select = (id: string) => {
    setSelectedId(id)
    setShowDetailOnMobile(true)
  }

  return (
    <main className="flex min-w-0 flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <p className="eyebrow">{t('reports.eyebrow')}</p>
          <h1 className="mt-1 font-display text-[1.75rem] leading-tight font-bold tracking-[-0.04em] text-ink">
            {t('reports.title')}
          </h1>
          <p className="mt-1 text-sm text-muted">{t('reports.subtitle')}</p>
        </div>
        {state.status !== 'disabled' && (
          <div className="flex items-center gap-3">
            {state.status === 'ready' && (
              <span className="text-xs font-semibold text-muted">{t('reports.count', { count: reports.length })}</span>
            )}
            <button
              type="button"
              onClick={reload}
              disabled={state.status === 'loading'}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink-soft transition hover:bg-surface-muted disabled:opacity-60"
            >
              {state.status === 'loading' ? <Spinner className="size-3.5" /> : <Icon name="refresh" className="size-3.5" />}
              {t('reports.refresh')}
            </button>
          </div>
        )}
      </header>

      {state.status === 'disabled' && <Notice icon="profile" text={t('reports.localMode')} />}

      {state.status === 'loading' && (
        <div role="status" className="card flex items-center justify-center gap-2 p-10 text-sm text-muted">
          <Spinner />
          {t('reports.loading')}
        </div>
      )}

      {state.status === 'error' && (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-crit/30 bg-crit-soft p-4 text-sm text-crit">
          <Icon name="alert" className="size-5" />
          <p className="flex-1">{t(`reports.errors.${state.error}`)}</p>
          <button type="button" onClick={reload} className="rounded-lg border border-crit/30 bg-surface px-3 py-1.5 text-xs font-semibold">
            {t('dashboard.errors.retry')}
          </button>
        </div>
      )}

      {state.status === 'ready' && reports.length === 0 && (
        <div className="card flex flex-col items-center gap-4 p-10 text-center">
          <div className="grid size-16 place-items-center rounded-2xl bg-brand-soft">
            <LogoMark className="size-10" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">{t('reports.empty.title')}</h2>
            <p className="mt-1.5 max-w-sm text-sm text-muted">{t('reports.empty.description')}</p>
          </div>
          <button type="button" onClick={() => onNavigate('dashboard')} className="btn-primary">
            <Icon name="dashboard" className="size-4" />
            {t('reports.empty.cta')}
          </button>
        </div>
      )}

      {state.status === 'ready' && selected && (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
          <nav aria-label={t('reports.listLabel')} className={showDetailOnMobile ? 'max-lg:hidden' : ''}>
            <ul className="flex flex-col gap-2 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto lg:pr-1">
              {reports.map((report) => (
                <ReportListItem key={report.id} report={report} selected={report.id === selected.id} onSelect={select} />
              ))}
            </ul>
          </nav>
          <div className={showDetailOnMobile ? '' : 'max-lg:hidden'}>
            <ReportDetail
              key={selected.id}
              report={selected}
              onDelete={async (id) => {
                const ok = await remove(id)
                if (ok) setSelectedId(null)
                return ok
              }}
              onBack={() => setShowDetailOnMobile(false)}
            />
          </div>
        </div>
      )}
    </main>
  )
}

function Notice({ icon, text }: { icon: 'profile'; text: string }) {
  return (
    <div className="card flex items-center gap-3 p-5 text-sm text-ink-soft">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-strong">
        <Icon name={icon} className="size-5" />
      </span>
      {text}
    </div>
  )
}
