import { AuthScreen } from './components/auth/AuthScreen'
import { AppShell } from './components/layout/AppShell'
import { LogoMark } from './components/ui/LogoMark'
import { useAuth } from './context/AuthContext'
import { useI18n } from './context/I18nContext'

/** Puerta de entrada: decide entre la pantalla de acceso y el panel según la sesión. */
export default function App() {
  const { status } = useAuth()
  const { t } = useI18n()

  if (status === 'loading') {
    return (
      <div role="status" className="grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-3 text-sm text-muted">
          <LogoMark className="size-12 animate-pulse" />
          {t('common.loading')}
        </div>
      </div>
    )
  }

  return status === 'unauthenticated' ? <AuthScreen /> : <AppShell />
}
