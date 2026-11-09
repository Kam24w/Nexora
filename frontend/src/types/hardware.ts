export interface StorageDevice {
  /** `null` cuando solo se conoce el tamaño del volumen del sistema. */
  model: string | null
  totalGb: number | null
}

/** Componentes del equipo donde corre Nexora (GET /hardware). */
export interface HardwareProfile {
  cpuModel: string | null
  physicalCores: number | null
  logicalCores: number | null
  ramTotalGb: number | null
  storage: StorageDevice[]
  gpus: string[]
  operatingSystem: string | null
  machineName: string | null
}
