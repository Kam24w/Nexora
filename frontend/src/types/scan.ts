/** Básico: procesos principales, ~20 s. Avanzado: inventario completo, hardware y observación larga, ~1 min. */
export type ScanType = 'basic' | 'advanced'

/** Pasos del colector, en el orden de main.SCAN_STEPS. */
export type ScanStep = 'metrics' | 'processes' | 'monitor' | 'hardware' | 'rules'

/** Pasos que ve el usuario: los del colector más los que ocurren en el cliente. */
export type ProgressStep = ScanStep | 'ai' | 'saving'

export interface ScanJobUpdate {
  step: ScanStep
  /** Avance dentro del paso, 0–1 (solo el muestreo de procesos lo informa). */
  stepFraction: number
}

export interface AnalysisProgress {
  type: ScanType
  steps: ProgressStep[]
  /** Índice del paso en curso dentro de `steps`. */
  current: number
  stepFraction: number
  startedAt: number
  /** Momento en que empezó cada paso alcanzado (ms epoch). */
  stepStartedAt: number[]
}
