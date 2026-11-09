import { ApiError } from './apiClient'

/** Por qué no respondió una función de IA del servicio local. */
export type AIFailureReason = 'ai_not_configured' | 'ai_unavailable' | 'ai_refused' | 'network'

const SERVER_REASONS: readonly AIFailureReason[] = ['ai_not_configured', 'ai_unavailable', 'ai_refused']

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

/** Traduce un `ApiError` a un motivo mostrable; re-lanza cualquier otro error (p. ej. AbortError). */
export const toAIFailure = (error: unknown): AIFailureReason => {
  if (!(error instanceof ApiError)) throw error
  if (error.kind !== 'http') return error.kind === 'timeout' ? 'ai_unavailable' : 'network'
  const code = isRecord(error.body) ? error.body.error : null
  return SERVER_REASONS.find((reason) => reason === code) ?? 'ai_unavailable'
}
