import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useI18n } from '../../context/I18nContext'
import { Icon } from './Icon'

function ErrorFallback() {
  const { t } = useI18n()
  return (
    <div role="alert" className="card flex flex-col items-center gap-4 p-10 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-crit-soft text-crit">
        <Icon name="alert" className="size-6" />
      </span>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">{t('common.errorTitle')}</h2>
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{t('common.errorDescription')}</p>
      </div>
      <button type="button" onClick={() => window.location.reload()} className="btn-primary">
        <Icon name="refresh" className="size-4" />
        {t('common.reload')}
      </button>
    </div>
  )
}

/** Un fallo de render (o de carga de una vista) no deja la aplicación en blanco. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Nexora] view crashed', error, info.componentStack)
  }

  render() {
    return this.state.failed ? <ErrorFallback /> : this.props.children
  }
}
