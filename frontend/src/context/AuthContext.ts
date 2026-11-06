import type {
  AuthResult,
  AuthSession,
  AuthUser,
  SignInCredentials,
  SignUpCredentials,
  SignUpOutcome,
} from '../types/auth'
import { createStrictContext } from './createStrictContext'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'local'

export interface AuthContextValue {
  status: AuthStatus
  session: AuthSession | null
  user: AuthUser | null
  isConfigured: boolean
  signIn: (credentials: SignInCredentials) => Promise<AuthResult<AuthSession>>
  signUp: (credentials: SignUpCredentials) => Promise<AuthResult<SignUpOutcome>>
  resetPassword: (email: string) => Promise<AuthResult<null>>
  signOut: () => Promise<void>
  /** Solo en desarrollo y sin Supabase configurado: permite usar el panel sin cuenta. */
  enterLocalMode: (() => void) | null
}

export const [AuthContext, useAuth] = createStrictContext<AuthContextValue>('Auth')
