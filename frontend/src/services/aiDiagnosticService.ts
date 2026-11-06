import type {
  AIDiagnosis,
  DiagnosisFinding,
  DiagnosisMetric,
  DiagnosisSolution,
  HealthLevel,
  SolutionImpact,
  SystemStatus,
  Telemetry,
} from '../types/diagnosis'
import type { Language } from '../types/preferences'
import { API_BASE_URL } from './diagnosisService'

/**
 * Cliente de AIDiagnosticService (diagnosis/ai_diagnostic_service.py, POST /ai-diagnosis).
 *
 * El motor de IA vive en el servidor: la clave de Anthropic nunca llega al navegador.
 * Este módulo envía la telemetría y el idioma activo y valida la respuesta antes de
 * entregarla a la UI.
 */

export type AIFailureReason = 'ai_not_configured' | 'ai_unavailable' | 'ai_refused' | 'network'

export type AIResult = { ok: true; diagnosis: AIDiagnosis } | { ok: false; reason: AIFailureReason }

const STATUSES: readonly SystemStatus[] = ['NORMAL', 'WARNING', 'CRITICAL']
const LEVELS: readonly HealthLevel[] = ['ok', 'warn', 'crit']
const METRICS: readonly DiagnosisMetric[] = ['cpu', 'ram', 'disk', 'temperature', 'process', 'none']
const IMPACTS: readonly SolutionImpact[] = ['low', 'medium', 'high']
const SERVER_REASONS: readonly AIFailureReason[] = ['ai_not_configured', 'ai_unavailable', 'ai_refused']

class InvalidAIResponse extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const text = (value: unknown): string => {
  if (typeof value !== 'string') throw new InvalidAIResponse('expected string')
  return value.trim()
}

const oneOf = <T extends string>(allowed: readonly T[], value: unknown): T => {
  const match = allowed.find((option) => option === value)
  if (!match) throw new InvalidAIResponse(`unexpected value ${String(value)}`)
  return match
}

const list = <T>(value: unknown, map: (item: Record<string, unknown>) => T): T[] =>
  Array.isArray(value) ? value.filter(isRecord).map(map) : []

const parseAIDiagnosis = (raw: unknown, language: Language): AIDiagnosis => {
  if (!isRecord(raw) || !isRecord(raw.probable_cause)) throw new InvalidAIResponse('invalid payload')
  const cause = raw.probable_cause

  return {
    status: oneOf(STATUSES, raw.status),
    summary: text(raw.summary),
    probableCause: {
      title: text(cause.title),
      explanation: text(cause.explanation),
      metric: oneOf(METRICS, cause.metric),
    },
    findings: list<DiagnosisFinding>(raw.findings, (finding) => ({
      title: text(finding.title),
      detail: text(finding.detail),
      severity: oneOf(LEVELS, finding.severity),
      metric: oneOf(METRICS, finding.metric),
    })),
    solutions: list<DiagnosisSolution>(raw.solutions, (solution) => ({
      title: text(solution.title),
      description: text(solution.description),
      impact: oneOf(IMPACTS, solution.impact),
      steps: Array.isArray(solution.steps) ? solution.steps.filter((s): s is string => typeof s === 'string') : [],
    })),
    language,
    source: 'ai',
    model: typeof raw.model === 'string' ? raw.model : null,
    generatedAt: new Date().toISOString(),
  }
}

export const aiDiagnosticService = {
  /** Genera la causa probable y las soluciones en `language` a partir de la telemetría. */
  async generate(telemetry: Telemetry, language: Language, signal?: AbortSignal): Promise<AIResult> {
    let response: Response
    try {
      response = await fetch(`${API_BASE_URL}/ai-diagnosis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telemetry, language }),
        signal,
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      return { ok: false, reason: 'network' }
    }

    let body: unknown = null
    try {
      body = await response.json()
    } catch {
      /* cuerpo vacío o no JSON */
    }

    if (!response.ok) {
      const code = isRecord(body) ? body.error : null
      return { ok: false, reason: SERVER_REASONS.find((reason) => reason === code) ?? 'ai_unavailable' }
    }

    try {
      return { ok: true, diagnosis: parseAIDiagnosis(body, language) }
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[Nexora] invalid AI diagnosis payload', error)
      return { ok: false, reason: 'ai_unavailable' }
    }
  },
}
