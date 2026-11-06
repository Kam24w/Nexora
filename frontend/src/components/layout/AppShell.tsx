import { DiagnosisProvider } from '../../context/DiagnosisProvider'
import { TelemetryPanel } from '../dashboard/TelemetryPanel'
import { DiagnosisPanel } from '../diagnosis/DiagnosisPanel'
import { Sidebar } from './Sidebar'

/**
 * Distribución de escritorio en 3 columnas:
 * Sidebar · Telemetría + análisis · Diagnóstico IA.
 * En ventanas más estrechas el diagnóstico baja bajo la telemetría y el sidebar se mantiene fijo.
 */
export function AppShell() {
  return (
    <DiagnosisProvider>
      <div className="mx-auto grid min-h-screen max-w-[1680px] items-start gap-5 p-5 lg:grid-cols-[248px_minmax(0,1fr)] xl:grid-cols-[256px_minmax(0,1fr)]">
        <Sidebar />
        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]">
          <TelemetryPanel />
          <DiagnosisPanel />
        </div>
      </div>
    </DiagnosisProvider>
  )
}
