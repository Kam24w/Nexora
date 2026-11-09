import { useState } from 'react'
import { useI18n } from '../../context/I18nContext'
import { getHighlightedProcesses, getLevel, getTemperatureLevel } from '../../services/healthService'
import type { StoredReport } from '../../services/reportsService'
import type { HealthLevel } from '../../types/diagnosis'
import { ProcessBadge } from '../dashboard/ProcessBadge'
import { FindingCard } from '../diagnosis/FindingCard'
import { HealthSummary } from '../diagnosis/HealthSummary'
import { SolutionCard } from '../diagnosis/SolutionCard'
import { Icon, type IconName } from '../ui/Icon'
import { LEVEL_STYLES, STATUS_LEVEL } from '../ui/levelStyles'
import { METRIC_ICON } from '../ui/metricIcons'
import { Spinner } from '../ui/Spinner'

interface ReportDetailProps {
  report: StoredReport
  onDelete: (id: string) => Promise<boolean>
  onBack: () => void
}

export function ReportDetail({ report, onDelete, onBack }: ReportDetailProps) {
  const { t, formatDate, formatNumber } = useI18n()
  const { payload } = report
  const { telemetry } = payload
  const status = STATUS_LEVEL[payload.status]
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteFailed, setDeleteFailed] = useState(false)

  const pct = (value: number) => t('common.percent', { value: formatNumber(value, { maximumFractionDigits: 1 }) })
  const mbps = (value: number) => t('common.mbps', { value: formatNumber(value, { maximumFractionDigits: 2 }) })

  const metrics: ReadonlyArray<{ icon: IconName; label: string; value: string; level: HealthLevel | null }> = [
    { icon: 'cpu', label: t('dashboard.metrics.cpu'), value: pct(telemetry.cpu), level: getLevel('cpu', telemetry.cpu) },
    { icon: 'memory', label: t('dashboard.metrics.ram'), value: pct(telemetry.ram), level: getLevel('ram', telemetry.ram) },
    { icon: 'disk', label: t('dashboard.metrics.disk'), value: pct(telemetry.disk_space), level: getLevel('disk', telemetry.disk_space) },
    {
      icon: 'thermometer',
      label: t('dashboard.metrics.temperature'),
      value:
        telemetry.cpu_temperature === null
          ? t('dashboard.metrics.temperatureUnavailable')
          : t('common.celsius', { value: formatNumber(telemetry.cpu_temperature, { maximumFractionDigits: 1 }) }),
      level: telemetry.cpu_temperature === null ? null : getTemperatureLevel(telemetry.cpu_temperature),
    },
    { icon: 'analysis', label: t('dashboard.metrics.read'), value: mbps(telemetry.disk_read), level: null },
    { icon: 'analysis', label: t('dashboard.metrics.write'), value: mbps(telemetry.disk_write), level: null },
  ]

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteFailed(false)
    const ok = await onDelete(report.id)
    setDeleting(false)
    if (!ok) {
      setDeleteFailed(true)
      setConfirming(false)
    }
  }

  return (
    <article className="card flex min-w-0 flex-col gap-5 p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="mb-2 flex items-center gap-1 text-xs font-semibold text-brand-strong hover:underline lg:hidden"
          >
            <Icon name="arrowRight" className="size-3.5 rotate-180" />
            {t('reports.detail.back')}
          </button>
          <p className="eyebrow">{formatDate(report.createdAt, { dateStyle: 'full', timeStyle: 'short' })}</p>
          <h2 className="mt-1.5 font-display text-xl leading-snug font-bold tracking-[-0.03em] text-ink">
            {payload.probable_cause.title || t(`diagnosis.status.${payload.status}.label`)}
          </h2>
          <p className="mt-1 text-xs text-muted">
            {t('reports.detail.generatedWith', {
              source: payload.source === 'ai' ? t('diagnosis.source.ai', { model: payload.model ?? 'LLM' }) : t('diagnosis.source.rules'),
              language: t(`languages.${payload.language}`),
            })}
            {payload.scan_type === 'deep' && ` · ${t('reports.detail.deepScan')}`}
          </p>
        </div>
        <span className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${LEVEL_STYLES[status].soft}`}>
          <span className={`size-2 rounded-full ${LEVEL_STYLES[status].dot}`} />
          {t(`diagnosis.status.${payload.status}.label`)}
        </span>
      </header>

      {payload.summary && <p className="text-sm leading-relaxed text-ink-soft">{payload.summary}</p>}

      {payload.probable_cause.explanation && (
        <section className="flex gap-3 rounded-2xl border border-brand/25 bg-linear-to-br from-brand-soft to-surface p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white">
            <Icon name={METRIC_ICON[payload.probable_cause.metric]} className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="eyebrow text-brand-strong">{t('diagnosis.probableCause')}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{payload.probable_cause.explanation}</p>
          </div>
        </section>
      )}

      <section aria-labelledby="report-telemetry">
        <h3 id="report-telemetry" className="eyebrow mb-2.5">
          {t('reports.detail.telemetry')}
        </h3>
        <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl bg-surface-muted p-3">
              <dt className="flex items-center gap-1.5 text-xs text-muted">
                <Icon name={metric.icon} className="size-3.5" />
                {metric.label}
              </dt>
              <dd className={`mt-1 font-display text-lg font-semibold tabular-nums ${metric.level ? LEVEL_STYLES[metric.level].text : 'text-ink'}`}>
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        {payload.findings.length > 0 && (
          <section aria-labelledby="report-findings">
            <h3 id="report-findings" className="eyebrow mb-2.5">
              {t('diagnosis.findings.title')}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {payload.findings.map((finding, index) => (
                <FindingCard key={`${index}-${finding.title}`} finding={finding} />
              ))}
            </ul>
          </section>
        )}
        {payload.solutions.length > 0 && (
          <section aria-labelledby="report-solutions">
            <h3 id="report-solutions" className="eyebrow mb-2.5">
              {t('diagnosis.solutions.title')}
            </h3>
            <ol className="flex flex-col gap-2">
              {payload.solutions.map((solution, index) => (
                <SolutionCard key={`${index}-${solution.title}`} solution={solution} />
              ))}
            </ol>
          </section>
        )}
      </div>

      {telemetry.processes.length > 0 && (
        <section aria-labelledby="report-processes">
          <h3 id="report-processes" className="eyebrow mb-2.5">
            {t('reports.detail.processes')}
          </h3>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[360px] text-sm">
              <thead className="bg-surface-muted text-left text-[0.65rem] font-bold tracking-wider text-muted uppercase">
                <tr>
                  <th className="px-3 py-2">{t('dashboard.processes.name')}</th>
                  <th className="px-3 py-2 text-right">{t('dashboard.processes.cpu')}</th>
                  <th className="px-3 py-2 text-right">{t('dashboard.processes.memory')}</th>
                </tr>
              </thead>
              <tbody>
                {getHighlightedProcesses(telemetry.processes, 5).map((process) => (
                  <tr key={`${process.pid}-${process.name}`} className="border-t border-line">
                    <td className="max-w-[260px] px-3 py-2" title={process.path ?? undefined}>
                      <p className="truncate font-medium text-ink">{process.name}</p>
                      <ProcessBadge category={process.category} />
                    </td>
                    <td className="px-3 py-2 text-right text-ink-soft tabular-nums">{pct(process.cpu)}</td>
                    <td className="px-3 py-2 text-right text-ink-soft tabular-nums">{pct(process.memory)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <HealthSummary score={payload.health_score} status={payload.status} level={status} />

      <footer className="flex flex-col gap-2 border-t border-line pt-4">
        {deleteFailed && (
          <p role="alert" className="text-xs text-crit">
            {t('reports.delete.error')}
          </p>
        )}
        {confirming ? (
          <div className="flex flex-col gap-2 rounded-xl bg-crit-soft p-3 sm:flex-row sm:items-center">
            <p className="flex-1 text-sm text-crit">{t('reports.delete.confirm')}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink-soft hover:bg-surface-muted"
              >
                {t('reports.delete.no')}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="flex items-center gap-1.5 rounded-lg bg-crit px-3 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-70"
              >
                {deleting && <Spinner className="size-3.5" />}
                {t('reports.delete.yes')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex items-center gap-1.5 self-end rounded-lg px-3 py-2 text-xs font-semibold text-muted transition hover:bg-crit-soft hover:text-crit"
          >
            <Icon name="close" className="size-3.5" />
            {t('reports.delete.action')}
          </button>
        )}
      </footer>
    </article>
  )
}
