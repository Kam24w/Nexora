import { useId, useState, type InputHTMLAttributes } from 'react'
import { useI18n } from '../../context/I18nContext'
import { Icon, type IconName } from '../ui/Icon'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  label: string
  icon: IconName
  error?: string
}

export function TextField({ label, icon, error, type = 'text', ...inputProps }: TextFieldProps) {
  const { t } = useI18n()
  const id = useId()
  const errorId = `${id}-error`
  const [reveal, setReveal] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-ink-soft">
        {label}
      </label>
      <div
        className={`flex items-center gap-2.5 rounded-xl border bg-surface px-3.5 transition focus-within:ring-4 ${
          error ? 'border-crit/60 focus-within:ring-crit-soft' : 'border-line focus-within:border-brand focus-within:ring-brand-soft'
        }`}
      >
        <Icon name={icon} className="size-4 text-muted" />
        <input
          id={id}
          type={isPassword && reveal ? 'text' : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent py-3 text-sm text-ink outline-none placeholder:text-muted/70"
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((value) => !value)}
            aria-label={t(reveal ? 'auth.hidePassword' : 'auth.showPassword')}
            aria-pressed={reveal}
            className="rounded-md p-1 text-muted hover:text-ink"
          >
            <Icon name={reveal ? 'eyeOff' : 'eye'} className="size-4" />
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-xs text-crit">
          {error}
        </p>
      )}
    </div>
  )
}
