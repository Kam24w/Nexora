import { useI18n } from '../../context/I18nContext'
import { useNow } from '../../hooks/useNow'
import { progressPercent } from '../../services/scanProgress'
import type { AnalysisProgress } from '../../types/scan'
import { Icon } from '../ui/Icon'
import { Spinner } from '../ui/Spinner'

const clock = (ms: number) => {
  const seconds = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** Barra de progreso global y registro de pasos con su duración, actualizados en tiempo real. */
export function ScanProgress({ progress }: { progress: AnalysisProgress }) {
  const { t } = useI18n()
  const now = useNow(1_000)
  const percent = progressPercent(progress)
  const { steps, current, stepStartedAt } = progress
  const currentLabel = t(`scan.steps.${steps[current]}`)

  return (
    <div className="flex w-full max-w-lg flex-col gap-4 text-left">
      <div>
        <div className="flex items-baseline justify-between gap-3 text-xs">
          <p className="font-semibold text-brand-strong">
            {t('scan.progress.step', { current: current + 1, total: steps.length })}
            <span className="text-ink-soft"> · {currentLabel}</span>
          </p>
          <p className="shrink-0 text-ink-soft tabular-nums">
            <span className="sr-only">{t('scan.progress.elapsed')}: </span>
            {clock(now - progress.startedAt)}
          </p>
        </div>
        <div
          role="progressbar"
          aria-label={t('scan.progress.label')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={`${percent} % · ${currentLabel}`}
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-sunken"
        >
          <div
            className="h-full rounded-full bg-linear-to-r from-(--btn-from) to-(--btn-to) transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(3, percent)}%` }}
          />
        </div>
      </div>

      <ol aria-label={t('scan.progress.log')} className="flex flex-col gap-1.5 rounded-xl bg-surface/70 p-3 ring-1 ring-line">
        {steps.map((step, index) => {
          const done = index < current
          const active = index === current
          const duration = done ? stepStartedAt[index + 1] - stepStartedAt[index] : active ? now - stepStartedAt[index] : null
          return (
            <li
              key={step}
              aria-current={active ? 'step' : undefined}
              className={`flex animate-fade-in items-center gap-2.5 text-xs ${done ? 'text-ink-soft' : active ? 'font-semibold text-ink' : 'text-muted'}`}
            >
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full ${
                  done ? 'bg-ok-soft text-ok' : active ? 'bg-brand-soft text-brand-strong' : 'bg-surface-sunken'
                }`}
              >
                {done ? <Icon name="check" className="size-3" strokeWidth={2.6} /> : active ? <Spinner className="size-3" /> : null}
              </span>
              <span className="flex-1">{t(`scan.steps.${step}`)}</span>
              <span className="tabular-nums">
                {duration === null ? <span className="sr-only">{t('scan.progress.pending')}</span> : clock(duration)}
              </span>
            </li>
          )
        })}
      </ol>

      {/* Solo se anuncia el cambio de paso, no cada segundo del cronómetro. */}
      <p role="status" className="sr-only">
        {t('scan.progress.step', { current: current + 1, total: steps.length })}: {currentLabel}
      </p>
    </div>
  )
}
