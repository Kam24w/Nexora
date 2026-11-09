import { lazy, Suspense, useEffect, useState } from 'react'
import { DiagnosisProvider } from '../../context/DiagnosisProvider'
import { useI18n } from '../../context/I18nContext'
import { parseRoute, routeHash, type AppRoute, type AppView } from '../../types/navigation'
import { TelemetryPanel } from '../dashboard/TelemetryPanel'
import { DiagnosisPanel } from '../diagnosis/DiagnosisPanel'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { Sidebar } from './Sidebar'

// Vistas secundarias en su propio fragmento: el panel inicial carga menos código.
const AnalysisView = lazy(() => import('../analysis/AnalysisView').then((module) => ({ default: module.AnalysisView })))
const ReportsView = lazy(() => import('../reports/ReportsView').then((module) => ({ default: module.ReportsView })))
const ProfileView = lazy(() => import('../profile/ProfileView').then((module) => ({ default: module.ProfileView })))
const ReportChatView = lazy(() => import('../chat/ReportChatView').then((module) => ({ default: module.ReportChatView })))

/** La vista activa vive en el hash (#reports, #chat/<id>…): sobrevive a recargas y permite volver atrás. */
const readRoute = (): AppRoute => parseRoute(window.location.hash)

/**
 * Distribución de escritorio:
 * - Panel y Análisis: Sidebar · contenido · Diagnóstico IA (3 columnas).
 * - Informes y Perfil: Sidebar · vista a ancho completo.
 * El DiagnosisProvider envuelve todas las vistas para que un análisis en curso no se pierda al navegar.
 */
export function AppShell() {
  const { t } = useI18n()
  const [route, setRoute] = useState<AppRoute>(readRoute)
  const { view } = route

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = (nextView: AppView, reportId: string | null = null) => {
    const next = { view: nextView, reportId }
    if (routeHash(next) === routeHash(route)) return
    window.location.hash = routeHash(next)
    setRoute(next)
    window.scrollTo({ top: 0 })
  }

  return (
    <DiagnosisProvider>
      <a href="#main-content" className="skip-link print:hidden">
        {t('common.skipToContent')}
      </a>
      <div className="mx-auto grid min-h-screen max-w-[1680px] items-start gap-5 p-5 lg:grid-cols-[248px_minmax(0,1fr)] xl:grid-cols-[256px_minmax(0,1fr)] print:block print:p-0">
        <Sidebar activeView={view === 'chat' ? 'reports' : view} onNavigate={navigate} />
        {/* La clave reinicia el límite de errores y la transición al cambiar de vista. */}
        <div key={routeHash(route)} id="main-content" tabIndex={-1} className="min-w-0 animate-fade-in outline-none">
          <ErrorBoundary>
            <Suspense fallback={<div role="status" aria-label={t('common.loading')} className="skeleton h-96" />}>
              {view === 'dashboard' && (
                <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]">
                  <TelemetryPanel />
                  <DiagnosisPanel />
                </div>
              )}
              {view === 'analysis' && <AnalysisView />}
              {view === 'reports' && <ReportsView onNavigate={navigate} />}
              {view === 'profile' && <ProfileView />}
              {view === 'chat' && route.reportId && <ReportChatView reportId={route.reportId} onBack={() => navigate('reports')} />}
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </DiagnosisProvider>
  )
}
