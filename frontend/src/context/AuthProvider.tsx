import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService } from '../services/authService'
import { isSupabaseConfigured } from '../services/supabaseClient'
import type { AuthSession, SignInCredentials, SignUpCredentials } from '../types/auth'
import { AuthContext, type AuthContextValue, type AuthStatus } from './AuthContext'

const allowLocalMode = import.meta.env.DEV && !isSupabaseConfigured

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? 'loading' : 'unauthenticated')

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true

    authService.getSession().then((restored) => {
      if (!active) return
      setSession(restored)
      setStatus(restored ? 'authenticated' : 'unauthenticated')
    })

    // Mantiene el estado sincronizado con login, logout, refresco del JWT y otras pestañas.
    const unsubscribe = authService.onSessionChange((next) => {
      if (!active) return
      setSession(next)
      setStatus(next ? 'authenticated' : 'unauthenticated')
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const signIn = useCallback((credentials: SignInCredentials) => authService.signIn(credentials), [])
  const signUp = useCallback((credentials: SignUpCredentials) => authService.signUp(credentials), [])
  const resetPassword = useCallback((email: string) => authService.resetPassword(email), [])

  const signOut = useCallback(async () => {
    if (status === 'local') {
      setStatus('unauthenticated')
      return
    }
    await authService.signOut()
    setSession(null)
    setStatus('unauthenticated')
  }, [status])

  const enterLocalMode = useCallback(() => setStatus('local'), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      isConfigured: isSupabaseConfigured,
      signIn,
      signUp,
      resetPassword,
      signOut,
      enterLocalMode: allowLocalMode ? enterLocalMode : null,
    }),
    [status, session, signIn, signUp, resetPassword, signOut, enterLocalMode],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
