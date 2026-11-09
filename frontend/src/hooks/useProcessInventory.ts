import { useMemo, useState } from 'react'
import type { ProcessSample } from '../types/diagnosis'

const FILTERS = {
  all: () => true,
  suspicious: (process: ProcessSample) => process.category === 'suspicious',
  system: (process: ProcessSample) => process.category === 'system' || process.category === 'system_unverified',
  application: (process: ProcessSample) => process.category === 'application',
} as const

export type ProcessFilter = keyof typeof FILTERS
export const PROCESS_FILTERS = Object.keys(FILTERS) as ProcessFilter[]

/** Filtro y orden del inventario: lo que requiere revisión va primero y, en cada grupo, por CPU. */
export function useProcessInventory(processes: ProcessSample[]) {
  const [filter, setFilter] = useState<ProcessFilter>('all')

  const counts = useMemo(
    () => Object.fromEntries(PROCESS_FILTERS.map((name) => [name, processes.filter(FILTERS[name]).length])) as Record<ProcessFilter, number>,
    [processes],
  )

  const visible = useMemo(
    () =>
      processes
        .filter(FILTERS[filter])
        .sort((a, b) => Number(b.category === 'suspicious') - Number(a.category === 'suspicious') || b.cpu - a.cpu),
    [processes, filter],
  )

  return { filter, setFilter, counts, visible }
}
