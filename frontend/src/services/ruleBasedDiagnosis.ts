import { resolveMessage, translate } from '../i18n'
import type { AIDiagnosis, DiagnosisFinding, DiagnosisMetric, HealthLevel, Telemetry } from '../types/diagnosis'
import type { Language } from '../types/preferences'
import { toMessage } from './diagnosisMessages'

/**
 * Motor de respaldo: convierte el pre-diagnóstico por reglas del backend en un
 * `AIDiagnosis` localizado. Se usa cuando el motor de IA no está disponible y para
 * el último diagnóstico guardado en disco, de modo que la UI tiene un único formato.
 */

const STATUS_LEVEL = { NORMAL: 'ok', WARNING: 'warn', CRITICAL: 'crit' } as const satisfies Record<string, HealthLevel>

const metricOf = (text: string): DiagnosisMetric => {
  const lower = text.toLowerCase()
  if (lower.includes('temperature')) return 'temperature'
  if (lower.includes('disk')) return 'disk'
  if (lower.includes('ram') || lower.includes('memory')) return 'ram'
  if (lower.includes('may be contributing') || lower.includes('persistent') || lower.includes('unexpected location')) return 'process'
  if (lower.includes('cpu')) return 'cpu'
  return 'none'
}

export const buildRuleBasedDiagnosis = (telemetry: Telemetry, language: Language): AIDiagnosis => {
  const t = (key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]) =>
    translate(language, key, params)
  const localize = (text: string) => resolveMessage(language, toMessage(text))
  const statusLevel = STATUS_LEVEL[telemetry.status]

  const findings: DiagnosisFinding[] = [
    ...telemetry.issues.map((issue) => ({
      title: localize(issue),
      detail: '',
      severity: statusLevel,
      metric: metricOf(issue),
    })),
    ...telemetry.causes.map((cause) => ({
      title: localize(cause),
      detail: '',
      severity: 'warn' as const,
      metric: metricOf(cause),
    })),
  ]

  const primary = telemetry.causes[0] ?? telemetry.issues[0]
  const probableCause = primary
    ? { title: localize(primary), explanation: t(`diagnosis.status.${telemetry.status}.description`), metric: metricOf(primary) }
    : { title: t('diagnosis.rules.healthyTitle'), explanation: t('diagnosis.rules.healthyExplanation'), metric: 'none' as const }

  return {
    status: telemetry.status,
    summary: t(`diagnosis.status.${telemetry.status}.description`),
    probableCause,
    findings,
    solutions: telemetry.recommendations.map((recommendation, index) => ({
      title: localize(recommendation),
      description: '',
      impact: index === 0 ? 'high' : 'medium',
      steps: [],
    })),
    language,
    source: 'rules',
    model: null,
    generatedAt: new Date().toISOString(),
  }
}
