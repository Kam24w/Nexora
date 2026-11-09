import type { TranslationKey } from '../types/i18n'
import { ApiError, apiRequest } from './apiClient'

/** Mismas reglas que security/input_validation.py. */
export const EMAIL_MAX_LENGTH = 100
const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 20
export const FULL_NAME_MAX_LENGTH = 100
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/
const VALIDATION_TIMEOUT_MS = 3_000

export type AuthField = 'fullName' | 'email' | 'password'
export type AuthFieldErrors = Partial<Record<AuthField, TranslationKey>>

export const validateEmail = (value: string): TranslationKey | null => {
  const email = value.trim()
  if (email.length > EMAIL_MAX_LENGTH) return 'auth.validation.emailTooLong'
  return EMAIL_PATTERN.test(email) && !email.includes('..') ? null : 'auth.validation.emailInvalid'
}

export const validatePassword = (password: string): TranslationKey | null => {
  // El spread cuenta caracteres reales, igual que `len` en Python (un emoji es 1, no 2).
  const length = [...password].length
  if (length < PASSWORD_MIN_LENGTH || length > PASSWORD_MAX_LENGTH) return 'auth.validation.passwordLength'
  if (/\p{C}/u.test(password) || !/\p{L}/u.test(password) || !/[0-9]/.test(password)) return 'auth.validation.passwordComposition'
  return null
}

const SERVER_ERRORS: Readonly<Record<string, Readonly<Record<string, TranslationKey>>>> = {
  email: { invalid: 'auth.validation.emailInvalid', too_long: 'auth.validation.emailTooLong' },
  password: { length: 'auth.validation.passwordLength', composition: 'auth.validation.passwordComposition' },
  full_name: { required: 'auth.validation.nameRequired' },
}

const FIELD_NAMES: Readonly<Record<string, AuthField>> = { email: 'email', password: 'password', full_name: 'fullName' }

interface AuthForm {
  mode: 'signIn' | 'signUp' | 'reset'
  email: string
  password: string
  fullName: string
}

export type ServerValidation = { ok: true; email: string; fullName: string } | { ok: false; errors: AuthFieldErrors }

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

/**
 * Valida y sanea el formulario en el servicio local (POST /auth/validate).
 * Si el servicio no está en marcha no se bloquea el acceso: la autenticación la
 * resuelve Supabase y las reglas de cliente ya se aplicaron.
 */
export async function validateOnServer({ mode, email, password, fullName }: AuthForm): Promise<ServerValidation> {
  const fallback: ServerValidation = { ok: true, email: email.trim(), fullName: fullName.trim() }
  try {
    const body = await apiRequest('/auth/validate', {
      method: 'POST',
      json: { mode, email, password: mode === 'reset' ? undefined : password, full_name: fullName },
      timeoutMs: VALIDATION_TIMEOUT_MS,
    })
    if (!isRecord(body) || typeof body.email !== 'string') return fallback
    return { ok: true, email: body.email, fullName: typeof body.full_name === 'string' ? body.full_name : fallback.fullName }
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 422 || !isRecord(error.body) || !isRecord(error.body.fields)) return fallback

    const errors: AuthFieldErrors = {}
    for (const [field, code] of Object.entries(error.body.fields)) {
      const key = typeof code === 'string' ? SERVER_ERRORS[field]?.[code] : undefined
      if (key && FIELD_NAMES[field]) errors[FIELD_NAMES[field]] = key
    }
    return Object.keys(errors).length ? { ok: false, errors } : fallback
  }
}
