import type { AuthError, Session } from '@supabase/supabase-js'
import type {
  AuthErrorCode,
  AuthResult,
  AuthSession,
  SignInCredentials,
  SignUpCredentials,
  SignUpOutcome,
} from '../types/auth'
import { supabase } from './supabaseClient'

/**
 * Módulo de autenticación. Es la única pieza de la app que conoce Supabase:
 * el resto trabaja con los tipos de dominio de `types/auth`.
 *
 * El SDK persiste la sesión (JWT de acceso + refresh token) en localStorage
 * y renueva el JWT automáticamente antes de que expire (`autoRefreshToken`).
 */

const toAuthSession = (session: Session): AuthSession => {
  const metadata = session.user.user_metadata as { full_name?: unknown } | undefined
  return {
    accessToken: session.access_token,
    expiresAt: session.expires_at ? session.expires_at * 1000 : null,
    user: {
      id: session.user.id,
      email: session.user.email ?? '',
      fullName: typeof metadata?.full_name === 'string' && metadata.full_name ? metadata.full_name : null,
      createdAt: session.user.created_at ?? null,
    },
  }
}

const ERROR_CODES: Readonly<Record<string, AuthErrorCode>> = {
  invalid_credentials: 'invalidCredentials',
  email_not_confirmed: 'emailNotConfirmed',
  user_already_exists: 'userAlreadyExists',
  email_exists: 'userAlreadyExists',
  weak_password: 'weakPassword',
  over_request_rate_limit: 'rateLimited',
  over_email_send_rate_limit: 'rateLimited',
}

const toErrorCode = (error: unknown): AuthErrorCode => {
  if (error instanceof TypeError) return 'network'
  if (!(error instanceof Error)) return 'unknown'
  const { code, status } = error as Partial<AuthError>
  if (code && ERROR_CODES[code]) return ERROR_CODES[code]
  if (status === 429) return 'rateLimited'
  if (error.name === 'AuthRetryableFetchError') return 'network'
  return 'unknown'
}

const fail = (error: unknown): { ok: false; error: AuthErrorCode } => ({ ok: false, error: toErrorCode(error) })
const NOT_CONFIGURED = { ok: false, error: 'notConfigured' } as const

export const authService = {
  async signIn({ email, password }: SignInCredentials): Promise<AuthResult<AuthSession>> {
    if (!supabase) return NOT_CONFIGURED
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) return fail(error)
      return { ok: true, data: toAuthSession(data.session) }
    } catch (error) {
      return fail(error)
    }
  },

  async signUp({ email, password, fullName }: SignUpCredentials): Promise<AuthResult<SignUpOutcome>> {
    if (!supabase) return NOT_CONFIGURED
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin },
      })
      if (error) return fail(error)
      // Con la protección contra enumeración de correos, un email ya registrado
      // devuelve un usuario sin identidades en lugar de un error.
      if (data.user?.identities?.length === 0) return { ok: false, error: 'userAlreadyExists' }
      return {
        ok: true,
        data: {
          session: data.session ? toAuthSession(data.session) : null,
          requiresEmailConfirmation: !data.session,
        },
      }
    } catch (error) {
      return fail(error)
    }
  },

  /** Actualiza el nombre visible (user_metadata.full_name). Dispara USER_UPDATED en onSessionChange. */
  async updateProfile(fullName: string): Promise<AuthResult<null>> {
    if (!supabase) return NOT_CONFIGURED
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: fullName.trim() } })
      return error ? fail(error) : { ok: true, data: null }
    } catch (error) {
      return fail(error)
    }
  },

  /** Cambia la contraseña del usuario con sesión iniciada. */
  async updatePassword(password: string): Promise<AuthResult<null>> {
    if (!supabase) return NOT_CONFIGURED
    try {
      const { error } = await supabase.auth.updateUser({ password })
      return error ? fail(error) : { ok: true, data: null }
    } catch (error) {
      return fail(error)
    }
  },

  async signOut(): Promise<AuthResult<null>> {
    if (!supabase) return NOT_CONFIGURED
    try {
      const { error } = await supabase.auth.signOut()
      return error ? fail(error) : { ok: true, data: null }
    } catch (error) {
      return fail(error)
    }
  },

  async resetPassword(email: string): Promise<AuthResult<null>> {
    if (!supabase) return NOT_CONFIGURED
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      })
      return error ? fail(error) : { ok: true, data: null }
    } catch (error) {
      return fail(error)
    }
  },

  /** Recupera la sesión persistida; el SDK renueva el JWT si ha expirado. */
  async getSession(): Promise<AuthSession | null> {
    if (!supabase) return null
    try {
      const { data } = await supabase.auth.getSession()
      return data.session ? toAuthSession(data.session) : null
    } catch {
      return null
    }
  },

  /** Notifica login, logout y refresco del JWT. Devuelve la función para cancelar la suscripción. */
  onSessionChange(callback: (session: AuthSession | null) => void): () => void {
    if (!supabase) return () => undefined
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session ? toAuthSession(session) : null)
    })
    return () => data.subscription.unsubscribe()
  },
}
