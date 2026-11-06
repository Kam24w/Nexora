export interface AuthUser {
  id: string
  email: string
  fullName: string | null
}

export interface AuthSession {
  user: AuthUser
  /** JWT de acceso emitido por Supabase. */
  accessToken: string
  /** Expiración del JWT en milisegundos (epoch). */
  expiresAt: number | null
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpCredentials extends SignInCredentials {
  fullName: string
}

/** Errores de dominio; la UI los traduce con la clave `auth.errors.<code>`. */
export type AuthErrorCode =
  | 'invalidCredentials'
  | 'emailNotConfirmed'
  | 'userAlreadyExists'
  | 'weakPassword'
  | 'rateLimited'
  | 'network'
  | 'notConfigured'
  | 'unknown'

export type AuthResult<T> = { ok: true; data: T } | { ok: false; error: AuthErrorCode }

export interface SignUpOutcome {
  session: AuthSession | null
  /** true cuando Supabase exige confirmar el correo antes de iniciar sesión. */
  requiresEmailConfirmation: boolean
}
