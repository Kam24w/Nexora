import { useState } from 'react'
import { useI18n } from '../../context/I18nContext'
import { useReportChat } from '../../hooks/useReportChat'
import { useStoredReport } from '../../hooks/useStoredReport'
import type { StoredReport } from '../../services/reportsService'
import type { TranslationKey } from '../../types/i18n'
import { HealthSummary } from '../diagnosis/HealthSummary'
import { Icon } from '../ui/Icon'
import { LEVEL_STYLES, STATUS_LEVEL } from '../ui/levelStyles'
import { LogoMark } from '../ui/LogoMark'
import { Spinner } from '../ui/Spinner'
import { ChatComposer } from './ChatComposer'
import { ChatMessages } from './ChatMessages'

const SUGGESTIONS: readonly TranslationKey[] = ['chat.suggestions.why', 'chat.suggestions.first', 'chat.suggestions.safe', 'chat.suggestions.explain']

interface ReportChatViewProps {
  reportId: string
  onBack: () => void
}

/** Vista dedicada: conversación con la IA sobre un informe guardado. */
export function ReportChatView({ reportId, onBack }: ReportChatViewProps) {
  const { t } = useI18n()
  const { state, retry } = useStoredReport(reportId)

  return (
    <main className="flex min-w-0 flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <button type="button" onClick={onBack} className="mb-1 flex items-center gap-1 text-xs font-semibold text-brand-strong hover:underline">
            <Icon name="arrowRight" className="size-3.5 rotate-180" />
            {t('chat.back')}
          </button>
          <h1 className="font-display text-[1.75rem] leading-tight font-bold tracking-[-0.04em] text-ink">{t('chat.title')}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t('chat.subtitle')}</p>
        </div>
      </header>

      {state.status === 'loading' && (
        <div role="status" className="grid gap-5 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
          <span className="sr-only">{t('common.loading')}</span>
          <div className="skeleton h-72" />
          <div className="skeleton h-96" />
        </div>
      )}

      {state.status === 'error' && (
        <div role="alert" className="card flex flex-wrap items-center gap-3 p-5 text-sm text-ink-soft">
          <Icon name="alert" className="size-5 text-warn" />
          <p className="flex-1">{t(state.error === 'notFound' ? 'chat.errors.notFound' : `reports.errors.${state.error}`)}</p>
          {state.error !== 'notFound' && (
            <button type="button" onClick={retry} className="btn-secondary">
              <Icon name="refresh" className="size-3.5" />
              {t('dashboard.errors.retry')}
            </button>
          )}
        </div>
      )}

      {state.status === 'ready' && <ChatLayout report={state.report} />}
    </main>
  )
}

function ChatLayout({ report }: { report: StoredReport }) {
  const { t, formatDate } = useI18n()
  const { messages, loading, sending, failure, storeError, send, clear } = useReportChat(report)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const { payload } = report
  const level = STATUS_LEVEL[payload.status]

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
      <aside aria-label={t('chat.reportSummary')} className="card flex flex-col gap-4 p-5 lg:sticky lg:top-5">
        <div>
          <p className="eyebrow">{formatDate(report.createdAt, { dateStyle: 'long', timeStyle: 'short' })}</p>
          <h2 className="mt-1.5 font-display text-lg leading-snug font-bold text-ink">
            {payload.probable_cause.title || t(`diagnosis.status.${payload.status}.label`)}
          </h2>
          <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${LEVEL_STYLES[level].soft}`}>
            <span className={`size-1.5 rounded-full ${LEVEL_STYLES[level].dot}`} />
            {t(`diagnosis.status.${payload.status}.label`)}
          </span>
        </div>
        {payload.summary && <p className="text-sm leading-relaxed text-ink-soft">{payload.summary}</p>}
        <HealthSummary score={payload.health_score} status={payload.status} level={level} />
        <p className="text-xs text-ink-soft">{t(payload.scan_type === 'deep' ? 'scan.types.advanced' : 'scan.types.basic')}</p>
      </aside>

      <section aria-label={t('chat.title')} className="card flex min-h-[32rem] flex-col p-5">
        {(storeError === 'missingTable' || storeError === 'notConfigured') && (
          <p role="status" className="mb-4 flex items-start gap-2 rounded-xl bg-warn-soft p-3 text-xs leading-relaxed text-warn">
            <Icon name="alert" className="mt-px size-4" />
            {t('chat.errors.historyUnavailable')}
          </p>
        )}
        {storeError && storeError !== 'missingTable' && storeError !== 'notConfigured' && (
          <p role="status" className="mb-4 flex items-start gap-2 rounded-xl bg-warn-soft p-3 text-xs leading-relaxed text-warn">
            <Icon name="alert" className="mt-px size-4" />
            {t('chat.errors.notSaved')}
          </p>
        )}

        <div className="flex-1">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-ink-soft">
              <Spinner className="size-4" />
              {t('chat.loadingHistory')}
            </p>
          ) : messages.length === 0 && !sending ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft">
                <LogoMark className="size-9" />
              </span>
              <div>
                <h3 className="font-display font-semibold text-ink">{t('chat.empty.title')}</h3>
                <p className="mt-1 max-w-sm text-sm text-ink-soft">{t('chat.empty.description')}</p>
              </div>
              <ul aria-label={t('chat.suggestions.label')} className="flex max-w-xl flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>
                    <button type="button" onClick={() => void send(t(suggestion))} className="btn-secondary rounded-full px-3.5">
                      {t(suggestion)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ChatMessages messages={messages} sending={sending} />
          )}
        </div>

        {failure && (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-crit-soft p-3 text-xs leading-relaxed text-crit">
            <Icon name="alert" className="mt-px size-4" />
            {t(`chat.errors.${failure}`)}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
          <ChatComposer onSend={(text) => void send(text)} sending={sending} />
          {messages.length > 0 && (
            <div className="flex justify-end">
              {confirmingClear ? (
                <span className="flex items-center gap-2 text-xs text-ink-soft">
                  {t('chat.clear.confirm')}
                  <button type="button" onClick={() => setConfirmingClear(false)} className="font-semibold hover:underline">
                    {t('reports.delete.no')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void clear().then(() => setConfirmingClear(false))}
                    className="font-semibold text-crit hover:underline"
                  >
                    {t('chat.clear.yes')}
                  </button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmingClear(true)} className="text-xs font-semibold text-ink-soft hover:text-crit">
                  {t('chat.clear.action')}
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
