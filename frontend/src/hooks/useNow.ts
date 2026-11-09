import { useEffect, useState } from 'react'

/** Marca de tiempo que se renueva cada `intervalMs` (textos relativos, cronómetros). Inactivo con `enabled` en false. */
export function useNow(intervalMs = 30_000, enabled = true) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs, enabled])
  return now
}
