import type { Language } from '../types/preferences'
import { toAIFailure, type AIFailureReason } from './aiErrors'
import { apiRequest } from './apiClient'
import type { DiagnosticReportPayload } from './reportsService'

/** Traducción y preguntas sobre un informe guardado (POST /reports/translate y /reports/chat). */

/** El modelo razona antes de responder; el servidor puede reintentar una traducción. */
const AI_TIMEOUT_MS = 90_000

export interface ReportTranslation {
  language: Language
  summary: string
  probable_cause: { title: string; explanation: string }
  findings: Array<{ title: string; detail: string }>
  solutions: Array<{ title: string; description: string; steps: string[] }>
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export type AssistantResult<T> = { ok: true; value: T } | { ok: false; reason: AIFailureReason }

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const str = (value: unknown): string => (typeof value === 'string' ? value : '')

const parseTranslation = (raw: unknown, language: Language): ReportTranslation | null => {
  if (!isRecord(raw) || !isRecord(raw.probable_cause) || !Array.isArray(raw.findings) || !Array.isArray(raw.solutions)) return null
  return {
    language,
    summary: str(raw.summary),
    probable_cause: { title: str(raw.probable_cause.title), explanation: str(raw.probable_cause.explanation) },
    findings: raw.findings.filter(isRecord).map((finding) => ({ title: str(finding.title), detail: str(finding.detail) })),
    solutions: raw.solutions.filter(isRecord).map((solution) => ({
      title: str(solution.title),
      description: str(solution.description),
      steps: Array.isArray(solution.steps) ? solution.steps.map(str) : [],
    })),
  }
}

export const reportAssistantService = {
  async translate(report: DiagnosticReportPayload, language: Language, signal?: AbortSignal): Promise<AssistantResult<ReportTranslation>> {
    try {
      const body = await apiRequest('/reports/translate', { method: 'POST', json: { report, language }, signal, timeoutMs: AI_TIMEOUT_MS })
      const translation = parseTranslation(body, language)
      return translation ? { ok: true, value: translation } : { ok: false, reason: 'ai_unavailable' }
    } catch (error) {
      return { ok: false, reason: toAIFailure(error) }
    }
  },

  async ask(
    report: DiagnosticReportPayload,
    history: readonly ChatTurn[],
    question: string,
    language: Language,
    signal?: AbortSignal,
  ): Promise<AssistantResult<string>> {
    try {
      const body = await apiRequest('/reports/chat', {
        method: 'POST',
        json: { report, messages: history, question, language },
        signal,
        timeoutMs: AI_TIMEOUT_MS,
      })
      const answer = isRecord(body) ? str(body.answer).trim() : ''
      return answer ? { ok: true, value: answer } : { ok: false, reason: 'ai_unavailable' }
    } catch (error) {
      return { ok: false, reason: toAIFailure(error) }
    }
  },
}
