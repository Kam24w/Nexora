import { useState } from 'react'
import './App.css'

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
  processes: {
    pid: number
    name: string
    cpu: number
    memory: number
  }[]
}

const level = (value: number) =>
  value >= 85 ? 'crit' : value >= 65 ? 'warn' : 'ok'

const STATUS = {
  NORMAL: {
    key: 'ok',
    label: 'Sistema estable',
    title: 'Tu sistema funciona correctamente',
  },
  WARNING: {
    key: 'warn',
    label: 'Atención',
    title: 'Tu sistema necesita atención',
  },
  CRITICAL: {
    key: 'crit',
    label: 'Problema crítico',
    title: 'Tu sistema presenta problemas críticos',
  },
} as const

function Meter({
  name,
  value,
  detail,
}: {
  name: string
  value: number
  detail?: string
}) {
  return (
    <div className="meter" data-level={level(value)}>
      <div className="meter-top">
        <span>{name}</span>
        <strong>{value.toFixed(1)}%</strong>
      </div>

      <div
        className="meter-track"
        role="progressbar"
        aria-label={name}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="meter-fill"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>

      {detail && <p className="meter-detail">{detail}</p>}
    </div>
  )
}

function App() {
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const analyzePC = () => {
    if (isAnalyzing) return

    setIsAnalyzing(true)

    fetch('http://127.0.0.1:5000/diagnose', {
      method: 'POST',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('No se pudo realizar el diagnóstico')
        }

        return response.json()
      })
      .then((data: Diagnosis) => {
        console.log('Diagnosis received:', data)
        setDiagnosis(data)
      })
      .catch((error) => {
        console.error('Diagnosis error:', error)
      })
      .finally(() => {
        setIsAnalyzing(false)
      })
  }

  const status =
    STATUS[diagnosis?.status as keyof typeof STATUS] ?? STATUS.NORMAL

  const topProcesses = [...(diagnosis?.processes ?? [])]
    .sort((a, b) => b.cpu - a.cpu)
    .slice(0, 5)

  return (
    <main className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            N
          </span>

          <div>
            <h1>Nexora</h1>
            <p>Diagnóstico inteligente de tu PC</p>
          </div>
        </div>

        <button
          className="analyze-button"
          onClick={analyzePC}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <span className="spinner" />
              Analizando...
            </>
          ) : (
            <>
              <span className="button-icon">↻</span>
              Analizar mi PC
            </>
          )}
        </button>
      </header>

      {!diagnosis ? (
        <section className="empty">
          <div className="empty-icon">⌁</div>

          <h2>Analiza el estado de tu equipo</h2>

          <p>
            Nexora revisará el uso de CPU, memoria, almacenamiento y procesos
            activos para detectar posibles problemas.
          </p>

          <button className="empty-button" onClick={analyzePC}>
            Comenzar análisis
          </button>
        </section>
      ) : (
        <>
          <section className="hero" data-level={status.key}>
            <div className="hero-top">
              <div>
                <span className="section-label">ESTADO DEL SISTEMA</span>

                <div className="status-row">
                  <span className="status-dot" />
                  <span className="pill">{status.label}</span>
                </div>
              </div>

              <span className="hero-symbol">N</span>
            </div>

            <h2>{status.title}</h2>

            {diagnosis.issues.length > 0 ? (
              <div className="issue-list">
                {diagnosis.issues.map((issue, index) => (
                  <p key={index}>{issue}</p>
                ))}
              </div>
            ) : (
              <p>
                No se detectaron problemas importantes en los recursos
                analizados.
              </p>
            )}
          </section>

          <section className="metrics" aria-label="Uso de recursos">
            <Meter name="CPU" value={diagnosis.cpu} />

            <Meter name="Memoria RAM" value={diagnosis.ram} />

            <Meter
              name="Almacenamiento"
              value={diagnosis.disk_space}
              detail={`Lectura ${diagnosis.disk_read} MB/s · Escritura ${diagnosis.disk_write} MB/s`}
            />
          </section>

          <div className="columns">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="section-label">ANÁLISIS</span>
                  <h2>Posibles causas</h2>
                </div>

                <span className="panel-number">
                  {diagnosis.causes.length.toString().padStart(2, '0')}
                </span>
              </div>

              {diagnosis.causes.length > 0 ? (
                <ul className="causes">
                  {diagnosis.causes.map((cause, index) => (
                    <li key={index}>
                      <span className="cause-number">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>

                      <span>{cause}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-data">
                  No se encontraron causas relevantes.
                </div>
              )}
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="section-label">SIGUIENTE PASO</span>
                  <h2>Qué puedes hacer</h2>
                </div>

                <span className="panel-number">
                  {diagnosis.recommendations.length
                    .toString()
                    .padStart(2, '0')}
                </span>
              </div>

              {diagnosis.recommendations.length > 0 ? (
                <ul className="recommendations">
                  {diagnosis.recommendations.map((recommendation, index) => (
                    <li key={index}>
                      <span className="check">✓</span>

                      <div>
                        <span className="recommendation-number">
                          RECOMENDACIÓN {String(index + 1).padStart(2, '0')}
                        </span>

                        <p>{recommendation}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-data">
                  No hay recomendaciones adicionales.
                </div>
              )}
            </section>
          </div>

          {topProcesses.length > 0 && (
            <section className="panel processes">
              <div className="panel-heading">
                <div>
                  <span className="section-label">ACTIVIDAD</span>
                  <h2>Procesos que más consumen</h2>
                </div>

                <span className="live-indicator">
                  <span />
                  EN VIVO
                </span>
              </div>

              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Proceso</th>
                      <th>PID</th>
                      <th>CPU</th>
                      <th>Memoria</th>
                    </tr>
                  </thead>

                  <tbody>
                    {topProcesses.map((process) => (
                      <tr key={process.pid}>
                        <td>
                          <span className="process-name">
                            {process.name}
                          </span>
                        </td>

                        <td>{process.pid}</td>

                        <td>
                          <span className="cpu-value">
                            {process.cpu.toFixed(1)}%
                          </span>
                        </td>

                        <td>{process.memory.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default App