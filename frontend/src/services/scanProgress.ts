import type { AnalysisProgress, ProgressStep, ScanType } from '../types/scan'

/** Pasos de cada tipo de análisis, alineados con main.SCAN_STEPS. */
const SCAN_STEPS: Readonly<Record<ScanType, readonly ProgressStep[]>> = {
  basic: ['metrics', 'processes', 'monitor', 'rules'],
  advanced: ['metrics', 'processes', 'monitor', 'hardware', 'rules'],
}

/**
 * Peso de cada paso en segundos medidos en un equipo real: la barra avanza al ritmo
 * del tiempo y no salta de golpe cuando un paso corto termina.
 */
const WEIGHTS: Readonly<Record<ScanType, Readonly<Partial<Record<ProgressStep, number>>>>> = {
  basic: { metrics: 4, processes: 4, monitor: 9, rules: 0.5, ai: 6, saving: 1 },
  advanced: { metrics: 4, processes: 12, monitor: 30, hardware: 2, rules: 0.5, ai: 6, saving: 1 },
}

export const startProgress = (type: ScanType, willSave: boolean, now = Date.now()): AnalysisProgress => ({
  type,
  steps: [...SCAN_STEPS[type], 'ai', ...(willSave ? (['saving'] as const) : [])],
  current: 0,
  stepFraction: 0,
  startedAt: now,
  stepStartedAt: [now],
})

/** Avanza al paso `step` (nunca retrocede) y registra cuándo empezó cada paso alcanzado. */
export const advanceProgress = (progress: AnalysisProgress, step: ProgressStep, stepFraction = 0, now = Date.now()): AnalysisProgress => {
  const index = progress.steps.indexOf(step)
  if (index < progress.current || index === -1) return progress
  if (index === progress.current) return { ...progress, stepFraction: Math.max(progress.stepFraction, stepFraction) }

  const stepStartedAt = [...progress.stepStartedAt]
  for (let i = progress.current + 1; i <= index; i++) stepStartedAt[i] = now
  return { ...progress, current: index, stepFraction, stepStartedAt }
}

/** Porcentaje global 0–100 ponderado por la duración típica de cada paso. */
export const progressPercent = ({ type, steps, current, stepFraction }: AnalysisProgress): number => {
  const weight = (step: ProgressStep) => WEIGHTS[type][step] ?? 1
  const total = steps.reduce((sum, step) => sum + weight(step), 0)
  const done = steps.slice(0, current).reduce((sum, step) => sum + weight(step), 0) + weight(steps[current]) * stepFraction
  return Math.min(99, Math.round((done / total) * 100))
}
