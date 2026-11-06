import { useI18n } from '../../context/I18nContext'
import type { DiagnosisSolution, SolutionImpact } from '../../types/diagnosis'
import { Icon } from '../ui/Icon'

const IMPACT_STYLE: Readonly<Record<SolutionImpact, string>> = {
  high: 'bg-brand text-white',
  medium: 'bg-brand-soft text-brand-strong',
  low: 'bg-surface-sunken text-muted',
}

export function SolutionCard({ solution }: { solution: DiagnosisSolution }) {
  const { t } = useI18n()

  return (
    <li className="flex animate-fade-in gap-3 rounded-xl bg-surface-muted p-3.5">
      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-brand text-white">
        <Icon name="check" className="size-3.5" strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
          <p className="text-sm leading-snug font-semibold text-ink">{solution.title}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-bold tracking-wide uppercase ${IMPACT_STYLE[solution.impact]}`}>
            {t(`diagnosis.solutions.impact.${solution.impact}`)}
          </span>
        </div>
        {solution.description && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{solution.description}</p>}
        {solution.steps.length > 0 && (
          <ol className="mt-2 flex list-decimal flex-col gap-1 pl-4 text-xs leading-relaxed text-ink-soft marker:font-semibold marker:text-brand-strong">
            {solution.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        )}
      </div>
    </li>
  )
}
