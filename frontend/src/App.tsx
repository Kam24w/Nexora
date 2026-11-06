import { useEffect, useMemo, useState } from 'react'
import './App.css'

interface Process {
  pid: number
  name: string
  cpu: number
  memory: number
}

interface Diagnosis {
  cpu: number
  ram: number
  disk_space: number
  disk_read: number
  disk_write: number
  status: string
  issues: string[]
  recommendations: string[]
  causes: string[]
  processes: Process[]
}

const STATUS = {
  NORMAL: {
    key: 'ok',
    label: 'Sistema estable',
    title: 'Tu sistema funciona correctamente',
    description: 'No se detectaron anomalías importantes en los recursos de tu PC.',
  },
  WARNING: {
    key: 'warn',
    label: 'Atención',
    title: 'Tu sistema necesita atención',
    description: 'Hay algunos indicadores que conviene revisar para mantener el rendimiento.',
  },
  CRITICAL: {
    key: 'crit',
    label: 'Problema crítico',
    title: 'Tu sistema presenta problemas críticos',
    description: 'Nexora detectó condiciones que pueden afectar la estabilidad de tu PC.',
  },
} as const

const getLevel = (value: number) =>
  value >= 85 ? 'crit' : value >= 65 ? 'warn' : 'ok'

function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="logo-gradient" x1="5" x2="43" y1="8" y2="39">
          <stop stopColor="#0ca8bf" />
          <stop offset=".52" stopColor="#16d3c4" />
          <stop offset="1" stopColor="#08749c" />
        </linearGradient>
      </defs>
      <path
        fill="url(#logo-gradient)"
        d="M11 35V14.6c0-4.1 5.3-5.8 7.7-2.5l12.6 17.4c1.7 2.4 5.7 1.2 5.7-1.8V13a4 4 0 1 1 8 0v20.4c0 5.9-7.6 8.3-11.1 3.6L21.3 19.7c-1.3-1.8-4.3-.9-4.3 1.3V35a4 4 0 1 1-8 0Z"
      />
      <path
        fill="none"
        stroke="#d7fbf5"
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M15 17v17m3-12v11m16-13v13m4-16v14"
        strokeDasharray="1 3"
      />
    </svg>
  )
}

function Icon({ name }: { name: 'dashboard' | 'activity' | 'history' | 'settings' | 'help' | 'refresh' | 'cpu' | 'memory' | 'disk' | 'arrow' }) {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    activity: <><path d="M3 12h4l2.2-6 4.1 12 2.2-6H21" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5M12 7v5l3 2" /></>,
    settings: <><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" /><path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3h-.2a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 0 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.4 2.4 0 1 1 3.9 1.9c-1 .8-1.6 1.2-1.6 2.6M12 17h.01" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.7-3L3 11m0 0V6m0 5h5M4 13a8 8 0 0 0 14.7 3L21 13m0 0v5m0-5h-5" /></>,
    cpu: <><rect x="5" y="5" width="14" height="14" rx="2" /><rect x="9" y="9" width="6" height="6" rx="1" /><path d="M9 1v4m6-4v4m0 14v4m-6-4v4M1 9h4m-4 6h4m14-6h4m-4 6h4" /></>,
    memory: <><rect x="3" y="7" width="18" height="10" rx="2" /><path d="M7 11h2m2 0h2m2 0h2M7 17v3m5-3v3m5-3v3" /></>,
    disk: <><path d="M5 4h14l2 4v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path d="M3 8h18M8 16h.01M12 16h4" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  }

  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function MetricCard({ label, value, icon, detail }: { label: string; value: number; icon: 'cpu' | 'memory' | 'disk'; detail: string }) {
  const status = getLevel(value)
  return (
    <article className="metric-card" data-level={status}>
      <div className="metric-card-top">
        <span className="metric-icon"><Icon name={icon} /></span>
        <span className="metric-status"><span />{status === 'ok' ? 'Normal' : status === 'warn' ? 'Atención' : 'Crítico'}</span>
      </div>
      <p>{label}</p>
      <div className="metric-value"><strong>{value.toFixed(1)}</strong><span>%</span></div>
      <div className="metric-progress"><span style={{ width: `${Math.min(value, 100)}%` }} /></div>
      <small>{detail}</small>
    </article>
  )
}

function App() {
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/diagnosis.json')
      .then((response) => response.ok ? response.json() : null)
      .then((data: Diagnosis | null) => data && setDiagnosis(data))
      .catch(() => undefined)
  }, [])

  const analyzePC = () => {
    if (isAnalyzing) return
    setIsAnalyzing(true)
    setError('')
    fetch('http://127.0.0.1:5000/diagnose', { method: 'POST' })
      .then((response) => {
        if (!response.ok) throw new Error('No se pudo realizar el diagnóstico')
        return response.json()
      })
      .then((data: Diagnosis) => setDiagnosis(data))
      .catch(() => setError('No pudimos conectar con el servicio de diagnóstico. Comprueba que el servidor esté activo.'))
      .finally(() => setIsAnalyzing(false))
  }

  const status = STATUS[diagnosis?.status as keyof typeof STATUS] ?? STATUS.NORMAL
  const topProcesses = useMemo(() => [...(diagnosis?.processes ?? [])].sort((a, b) => b.cpu - a.cpu).slice(0, 5), [diagnosis])

  return (
    <main className="desktop-shell">
      <aside className="sidebar">
        <div className="brand">
          <LogoMark />
          <span>Nexora</span>
        </div>
        <p className="workspace-label">ESPACIO DE TRABAJO</p>
        <nav className="main-nav" aria-label="Navegación principal">
          <button className="nav-item active"><Icon name="dashboard" />Panel de diagnóstico</button>
          <button className="nav-item"><Icon name="activity" />Actividad del sistema</button>
          <button className="nav-item"><Icon name="history" />Historial</button>
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item"><Icon name="settings" />Configuración</button>
          <button className="nav-item"><Icon name="help" />Centro de ayuda</button>
          <div className="user-card"><div className="avatar">CL</div><div><strong>Camilo López</strong><span>Administrador</span></div><span className="user-more">•••</span></div>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><p className="eyebrow">NEXORA / MONITOR</p><h1>Panel de diagnóstico</h1></div>
          <div className="topbar-actions"><span className="last-scan">Último análisis: <strong>hace unos segundos</strong></span><button className="analyze-button" onClick={analyzePC} disabled={isAnalyzing}><Icon name="refresh" />{isAnalyzing ? 'Analizando...' : 'Analizar ahora'}</button></div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        {!diagnosis ? (
          <section className="welcome-card">
            <div className="welcome-art"><LogoMark /></div>
            <div><p className="eyebrow">DIAGNÓSTICO INTELIGENTE</p><h2>Conoce el estado real de tu PC</h2><p>Analiza el rendimiento, encuentra posibles causas y recibe recomendaciones claras para mantener tu equipo funcionando al máximo.</p><button className="primary-button" onClick={analyzePC}>Iniciar diagnóstico <Icon name="arrow" /></button></div>
          </section>
        ) : (
          <>
            <section className="status-banner" data-level={status.key}>
              <div className="status-copy"><div className="status-heading"><span className="status-pulse" /><span>{status.label}</span></div><h2>{status.title}</h2><p>{status.description}</p></div>
              <div className="status-score"><span>ESTADO GENERAL</span><strong>{diagnosis.status === 'CRITICAL' ? '42' : diagnosis.status === 'WARNING' ? '68' : '94'}<small>/100</small></strong></div>
            </section>
            <div className="section-title"><div><p className="eyebrow">RECURSOS DEL EQUIPO</p><h2>Rendimiento en tiempo real</h2></div><span className="live-tag"><i /> ACTUALIZADO</span></div>
            <section className="metrics-grid">
              <MetricCard label="Uso de CPU" value={diagnosis.cpu} icon="cpu" detail="Procesamiento del sistema" />
              <MetricCard label="Memoria RAM" value={diagnosis.ram} icon="memory" detail="Memoria utilizada" />
              <MetricCard label="Almacenamiento" value={diagnosis.disk_space} icon="disk" detail={`${diagnosis.disk_read} MB/s lectura · ${diagnosis.disk_write} MB/s escritura`} />
            </section>
            <div className="analysis-grid">
              <section className="surface-card"><div className="card-heading"><div><p className="eyebrow">ANÁLISIS</p><h2>Causas probables</h2></div><span className="count-badge">{diagnosis.causes.length}</span></div>{diagnosis.causes.length ? <ul className="cause-list">{diagnosis.causes.map((cause, index) => <li key={cause}><span>{String(index + 1).padStart(2, '0')}</span><p>{cause}</p></li>)}</ul> : <p className="muted-copy">No se encontraron causas relevantes.</p>}</section>
              <section className="surface-card recommendations-card"><div className="card-heading"><div><p className="eyebrow">PLAN DE ACCIÓN</p><h2>Soluciones recomendadas</h2></div><span className="count-badge">{diagnosis.recommendations.length}</span></div>{diagnosis.recommendations.length ? <ul className="recommendation-list">{diagnosis.recommendations.map((recommendation, index) => <li key={recommendation}><span className="check-mark">✓</span><div><small>RECOMENDACIÓN {String(index + 1).padStart(2, '0')}</small><p>{recommendation}</p></div></li>)}</ul> : <p className="muted-copy">No hay recomendaciones adicionales.</p>}</section>
            </div>
            {topProcesses.length > 0 && <section className="surface-card process-card"><div className="card-heading"><div><p className="eyebrow">MONITOREO ACTIVO</p><h2>Procesos con mayor consumo</h2></div><span className="live-tag"><i /> EN VIVO</span></div><table><thead><tr><th>Proceso</th><th>PID</th><th>CPU</th><th>Memoria</th></tr></thead><tbody>{topProcesses.map((process) => <tr key={process.pid}><td><span className="process-dot" />{process.name}</td><td>{process.pid}</td><td><strong className="cpu-text">{process.cpu.toFixed(1)}%</strong></td><td>{process.memory.toFixed(1)}%</td></tr>)}</tbody></table></section>}
          </>
        )}
      </section>
    </main>
  )
}

export default App
