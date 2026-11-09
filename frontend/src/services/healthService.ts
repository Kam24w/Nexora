import type { Telemetry, HealthLevel, MetricKind, ProcessSample } from '../types/diagnosis'

/** Umbrales por métrica, alineados con diagnosis/diagnosis.py. */
export const THRESHOLDS: Readonly<Record<MetricKind, { warn: number; crit: number }>> = {
  cpu: { warn: 60, crit: 80 },
  ram: { warn: 80, crit: 90 },
  disk: { warn: 85, crit: 90 },
}

export const getLevel = (kind: MetricKind, value: number): HealthLevel => {
  const { warn, crit } = THRESHOLDS[kind]
  return value >= crit ? 'crit' : value >= warn ? 'warn' : 'ok'
}

/** Umbrales de temperatura en °C, alineados con diagnosis/diagnosis.py. */
export const TEMPERATURE_THRESHOLDS = { warn: 80, crit: 90 } as const

export const getTemperatureLevel = (celsius: number): HealthLevel =>
  celsius >= TEMPERATURE_THRESHOLDS.crit ? 'crit' : celsius >= TEMPERATURE_THRESHOLDS.warn ? 'warn' : 'ok'

const penalty = (kind: MetricKind, value: number): number => {
  const { warn, crit } = THRESHOLDS[kind]
  if (value < warn) return 0
  if (value < crit) return ((value - warn) / (crit - warn)) * 20
  return 25 + ((value - crit) / Math.max(1, 100 - crit)) * 25
}

/** Puntuación de salud 0–100 calculada a partir de las métricas reales. */
export const getHealthScore = ({ cpu, ram, disk_space }: Telemetry): number => {
  const score = 100 - penalty('cpu', cpu) - penalty('ram', ram) - penalty('disk', disk_space)
  return Math.round(Math.min(100, Math.max(0, score)))
}

export const getTopProcesses = (processes: ProcessSample[], limit = 5): ProcessSample[] =>
  [...processes].sort((a, b) => b.cpu - a.cpu).slice(0, limit)

/** Los de mayor consumo más los que requieren revisión, aunque apenas consuman: no deben perderse. */
export const getHighlightedProcesses = (processes: ProcessSample[], limit = 5): ProcessSample[] => {
  const top = getTopProcesses(processes, limit)
  return [...top, ...processes.filter((process) => process.category === 'suspicious' && !top.includes(process))]
}
