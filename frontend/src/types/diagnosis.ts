import type { Language } from './preferences'

/** Estado global del sistema. */
export type SystemStatus = 'NORMAL' | 'WARNING' | 'CRITICAL'

/** Severidad de una métrica u hallazgo. */
export type HealthLevel = 'ok' | 'warn' | 'crit'

export type MetricKind = 'cpu' | 'ram' | 'disk'

/**
 * Clasificación del colector (collector/process_classifier.py). Ningún proceso se oculta:
 * - system: componente de Windows con la ubicación confirmada.
 * - system_unverified: nombre de Windows, pero el sistema no deja leer su ruta.
 * - suspicious: nombre de Windows ejecutándose desde una carpeta inesperada.
 */
export type ProcessCategory = 'system' | 'system_unverified' | 'suspicious' | 'application'

export type ProcessSummary = Record<ProcessCategory | 'total', number>

export type ScanType = 'standard' | 'deep'

export interface ProcessSample {
  pid: number
  name: string
  /** Porcentaje de CPU (puede superar 100 en equipos multinúcleo). */
  cpu: number
  /** Porcentaje de memoria RAM utilizada. */
  memory: number
  category: ProcessCategory
  /** Ruta del ejecutable (sin el nombre de la cuenta); `null` si no se pudo leer. */
  path: string | null
}

/** Telemetría capturada por el servicio local (POST /diagnose) junto al pre-diagnóstico por reglas. */
export interface Telemetry {
  cpu: number
  ram: number
  disk_space: number
  /** MB/s */
  disk_read: number
  /** MB/s */
  disk_write: number
  /** °C; `null` cuando el sistema operativo no expone sensores. */
  cpu_temperature: number | null
  temperature_source: string | null
  status: SystemStatus
  issues: string[]
  recommendations: string[]
  causes: string[]
  processes: ProcessSample[]
  scan_type: ScanType
  /** `null` en diagnósticos guardados por versiones anteriores. */
  process_summary: ProcessSummary | null
}

/** Métrica a la que se atribuye una causa o hallazgo. */
export type DiagnosisMetric = 'cpu' | 'ram' | 'disk' | 'temperature' | 'process' | 'none'

export type SolutionImpact = 'low' | 'medium' | 'high'

export interface ProbableCause {
  title: string
  explanation: string
  metric: DiagnosisMetric
}

export interface DiagnosisFinding {
  title: string
  /** Puede venir vacío en el diagnóstico por reglas. */
  detail: string
  severity: HealthLevel
  metric: DiagnosisMetric
}

export interface DiagnosisSolution {
  title: string
  description: string
  impact: SolutionImpact
  steps: string[]
}

/** De dónde sale el diagnóstico: el motor de IA o el motor de reglas local (respaldo). */
export type DiagnosisSource = 'ai' | 'rules'

/** Causa probable y soluciones accionables, ya redactadas en `language`. */
export interface AIDiagnosis {
  status: SystemStatus
  summary: string
  probableCause: ProbableCause
  findings: DiagnosisFinding[]
  solutions: DiagnosisSolution[]
  language: Language
  source: DiagnosisSource
  /** Modelo que generó el diagnóstico; `null` en el motor de reglas. */
  model: string | null
  /** ISO 8601 */
  generatedAt: string
}
