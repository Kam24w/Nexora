import { createStrictContext } from './createStrictContext'

export type ToastKind = 'success' | 'error' | 'info'

export interface ToastInput {
  kind: ToastKind
  title: string
  description?: string
}

export interface Toast extends ToastInput {
  id: number
}

export interface ToastContextValue {
  /** Muestra un aviso flotante que se cierra solo a los pocos segundos. */
  notify: (toast: ToastInput) => void
  dismiss: (id: number) => void
  toasts: readonly Toast[]
}

export const [ToastContext, useToast] = createStrictContext<ToastContextValue>('Toast')
