import type { DiagnosisMetric } from '../../types/diagnosis'
import type { IconName } from './Icon'

/** Icono asociado a cada métrica de diagnóstico. */
export const METRIC_ICON: Readonly<Record<DiagnosisMetric, IconName>> = {
  cpu: 'cpu',
  ram: 'memory',
  disk: 'disk',
  temperature: 'thermometer',
  process: 'analysis',
  none: 'check',
}
