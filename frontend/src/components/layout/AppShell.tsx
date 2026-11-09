import { useEffect, useState } from 'react'
import { DiagnosisProvider } from '../../context/DiagnosisProvider'
import { APP_VIEWS, type AppView } from '../../types/navigation'
import { AnalysisView } from '../analysis/AnalysisView'
import { TelemetryPanel } from '../dashboard/TelemetryPanel'
import { DiagnosisPanel } from '../diagnosis/DiagnosisPanel'
import { ProfileView } from '../profile/ProfileView'
import { ReportsView } from '../reports/ReportsView'
import { Sidebar } from './Sidebar'

/** La vista activa vive en el hash (#reports, #profile): sobrevive a recargas y permite volver atrás. */
const readView = (): AppView => {
  const hash = window.location.hash.replace(/^#/, '')
  return APP_VIEWS.find((view) => view === hash) ?? 'dashboard'
}

/**
 * Distribución de escritorio:
 * - Panel y Análisis: Sidebar · contenido · Diagnóstico IA (3 columnas).
 * - Informes y Perfil: Sidebar · vista a ancho completo.
 * El DiagnosisProvider envuelve todas las vistas para que un análisis en curso no se pierda al navegar.
 */
export function AppShell() {
  const [view, setView] = useState<AppView>(readView)

  useEffect(() => {
    const onHashChange = () => setView(readView())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = (next: AppView) => {
    if (next === view) return
    window.location.hash = next === 'dashboard' ? '' : next
    setView(next)
    window.scrollTo({ top: 0 })
  }

  return (
    <DiagnosisProvider>
      <div className="mx-auto grid min-h-screen max-w-[1680px] items-start gap-5 p-5 lg:grid-cols-[248px_minmax(0,1fr)] xl:grid-cols-[256px_minmax(0,1fr)]">
        <Sidebar activeView={view} onNavigate={navigate} />
        {view === 'dashboard' && (
          <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]">
            <TelemetryPanel />
            <DiagnosisPanel />
          </div>
        )}
        {view === 'analysis' && <AnalysisView />}
        {view === 'reports' && <ReportsView onNavigate={navigate} />}
        {view === 'profile' && <ProfileView />}
      </div>
    </DiagnosisProvider>
  )
}
