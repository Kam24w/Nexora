import { useI18n } from '../../context/I18nContext'
import { useToast, type ToastKind } from '../../context/ToastContext'
import { Icon, type IconName } from './Icon'

const STYLES: Readonly<Record<ToastKind, { icon: IconName; badge: string; bar: string }>> = {
  success: { icon: 'check', badge: 'bg-ok-soft text-ok', bar: 'bg-ok' },
  error: { icon: 'alert', badge: 'bg-crit-soft text-crit', bar: 'bg-crit' },
  info: { icon: 'sparkles', badge: 'bg-brand-soft text-brand-strong', bar: 'bg-brand' },
}

/** Pila de avisos en la esquina inferior; los lectores de pantalla los anuncian al aparecer. */
export function Toaster() {
  const { toasts, dismiss } = useToast()
  const { t } = useI18n()

  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 print:hidden">
      {toasts.map((toast) => {
        const style = STYLES[toast.kind]
        return (
          <div
            key={toast.id}
            role={toast.kind === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto relative flex animate-toast-in items-start gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-4 pl-5 shadow-card"
          >
            <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${style.bar}`} />
            <span className={`grid size-8 shrink-0 place-items-center rounded-full ${style.badge}`}>
              <Icon name={style.icon} className="size-4" strokeWidth={2.4} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{toast.title}</p>
              {toast.description && <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{toast.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label={t('common.closeNotification')}
              title={t('common.closeNotification')}
              className="rounded-md p-1 text-muted transition hover:bg-surface-muted hover:text-ink"
            >
              <Icon name="close" className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
