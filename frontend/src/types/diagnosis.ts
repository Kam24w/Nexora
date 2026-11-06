/** Estado global devuelto por el motor de diagnóstico (diagnosis/diagnosis.py). */
export type SystemStatus = 'NORMAL' | 'WARNING' | 'CRITICAL'

/** Severidad de una métrica individual. */
export type HealthLevel = 'ok' | 'warn' | 'crit'

export type MetricKind = 'cpu' | 'ram' | 'disk'

export interface ProcessSample {
  pid: number
  name: string
  /** Porcentaje de CPU (puede superar 100 en equipos multinúcleo). */
  cpu: number
  /** Porcentaje de memoria RAM utilizada. */
  memory: number
}

export interface Diagnosis {
  cpu: number
  ram: number
  disk_space: number
  /** MB/s */
  disk_read: number
  /** MB/s */
  disk_write: number
  status: SystemStatus
  issues: string[]
  recommendations: string[]
  causes: string[]
  processes: ProcessSample[]
}
