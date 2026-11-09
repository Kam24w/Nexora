import type { HardwareProfile } from '../types/hardware'
import { apiRequest } from './apiClient'

/** La primera consulta lanza PowerShell/WMI; las siguientes salen de la caché del servicio. */
const HARDWARE_TIMEOUT_MS = 45_000

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const str = (value: unknown): string | null => (typeof value === 'string' && value ? value : null)
const num = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null)

const parseHardware = (raw: unknown): HardwareProfile => {
  const body = isRecord(raw) ? raw : {}
  const cpu = isRecord(body.cpu) ? body.cpu : {}
  return {
    cpuModel: str(cpu.model),
    physicalCores: num(cpu.physical_cores),
    logicalCores: num(cpu.logical_cores),
    ramTotalGb: num(body.ram_total_gb),
    storage: Array.isArray(body.storage)
      ? body.storage.filter(isRecord).map((drive) => ({ model: str(drive.model), totalGb: num(drive.total_gb) }))
      : [],
    gpus: Array.isArray(body.gpus) ? body.gpus.filter((gpu): gpu is string => typeof gpu === 'string') : [],
    operatingSystem: str(body.operating_system),
    machineName: str(body.machine_name),
  }
}

export const hardwareService = {
  /** Lanza `ApiError` si el servicio local no está disponible. */
  async get(signal?: AbortSignal): Promise<HardwareProfile> {
    return parseHardware(await apiRequest('/hardware', { signal, timeoutMs: HARDWARE_TIMEOUT_MS }))
  },
}
