import type { HealthLevel, SystemStatus } from '../../types/diagnosis'

/** Clases de Tailwind por severidad. Cadenas completas para que Tailwind las detecte al compilar. */
export const LEVEL_STYLES: Readonly<Record<HealthLevel, { text: string; soft: string; dot: string; stroke: string }>> = {
  ok: { text: 'text-ok', soft: 'bg-ok-soft text-ok', dot: 'bg-ok', stroke: 'stroke-ok' },
  warn: { text: 'text-warn', soft: 'bg-warn-soft text-warn', dot: 'bg-warn', stroke: 'stroke-warn' },
  crit: { text: 'text-crit', soft: 'bg-crit-soft text-crit', dot: 'bg-crit', stroke: 'stroke-crit' },
}

export const STATUS_LEVEL: Readonly<Record<SystemStatus, HealthLevel>> = {
  NORMAL: 'ok',
  WARNING: 'warn',
  CRITICAL: 'crit',
}
