import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Toaster } from '../components/ui/Toaster'
import { ToastContext, type Toast, type ToastContextValue, type ToastInput } from './ToastContext'

const VISIBLE_MS = 5_000
const MAX_TOASTS = 3

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, number>())

  const dismiss = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (input: ToastInput) => {
      const id = ++nextId.current
      setToasts((current) => [...current, { ...input, id }].slice(-MAX_TOASTS))
      timers.current.set(id, window.setTimeout(() => dismiss(id), VISIBLE_MS))
    },
    [dismiss],
  )

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const value = useMemo<ToastContextValue>(() => ({ notify, dismiss, toasts }), [notify, dismiss, toasts])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  )
}
