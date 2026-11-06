import type { Message, TranslationKey } from '../types/i18n'

/**
 * El motor de diagnóstico en Python emite mensajes en inglés. Este adaptador los
 * convierte en claves i18n para mostrarlos en el idioma del usuario. Un mensaje
 * desconocido se muestra tal cual, de modo que añadir reglas al backend nunca rompe la UI.
 */
const RULES: ReadonlyArray<{ pattern: RegExp; key: TranslationKey }> = [
  { pattern: /^High CPU usage$/, key: 'backend.issues.highCpu' },
  { pattern: /^Elevated CPU usage$/, key: 'backend.issues.elevatedCpu' },
  { pattern: /^High RAM usage$/, key: 'backend.issues.highRam' },
  { pattern: /^Elevated RAM usage$/, key: 'backend.issues.elevatedRam' },
  { pattern: /^Low disk space$/, key: 'backend.issues.lowDisk' },
  { pattern: /^Disk space is getting low$/, key: 'backend.issues.diskGettingLow' },
  { pattern: /^High disk activity$/, key: 'backend.issues.highDiskActivity' },
  { pattern: /^High system temperature$/, key: 'backend.issues.highTemperature' },
  { pattern: /^Elevated system temperature$/, key: 'backend.issues.elevatedTemperature' },
  { pattern: /^Check that the vents are clean and the fans are working\.$/, key: 'backend.recommendations.checkCooling' },
  { pattern: /^Persistent high CPU usage in (?<name>.+)$/, key: 'backend.issues.persistentCpu' },
  { pattern: /^Close unnecessary applications or processes\.$/, key: 'backend.recommendations.closeUnnecessary' },
  { pattern: /^Consider closing applications that are using a lot of CPU\.$/, key: 'backend.recommendations.closeCpuHeavy' },
  { pattern: /^Close applications that are using a lot of memory\.$/, key: 'backend.recommendations.closeMemoryHeavy' },
  { pattern: /^Consider closing some applications to reduce memory usage\.$/, key: 'backend.recommendations.reduceMemory' },
  { pattern: /^Free up disk space by removing unnecessary files\.$/, key: 'backend.recommendations.freeDisk' },
  { pattern: /^Consider freeing up some disk space\.$/, key: 'backend.recommendations.considerFreeDisk' },
  { pattern: /^Consider closing (?<name>.+) if it is not needed\.$/, key: 'backend.recommendations.closeProcess' },
  { pattern: /^(?<name>.+) may be contributing to high CPU usage\.$/, key: 'backend.causes.processCpu' },
]

export const toMessage = (text: string): Message => {
  const trimmed = text.trim()
  for (const { pattern, key } of RULES) {
    const match = pattern.exec(trimmed)
    if (match) return { key, params: match.groups ? { ...match.groups } : undefined }
  }
  return { raw: text }
}
