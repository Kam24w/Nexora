import { useI18n } from '../../context/I18nContext'
import { getPasswordChecks } from '../../services/authValidation'
import type { TranslationKey } from '../../types/i18n'
import { Icon } from '../ui/Icon'

const RULES: ReadonlyArray<{ key: 'length' | 'letter' | 'number'; label: TranslationKey }> = [
  { key: 'length', label: 'auth.requirements.length' },
  { key: 'letter', label: 'auth.requirements.letter' },
  { key: 'number', label: 'auth.requirements.number' },
]

/** Requisitos de la contraseña que se marcan mientras el usuario escribe. */
export function PasswordRequirements({ id, password }: { id: string; password: string }) {
  const { t } = useI18n()
  const checks = getPasswordChecks(password)

  return (
    <div id={id} className="rounded-xl bg-surface-muted px-3 py-2.5">
      <p className="text-xs font-semibold text-ink-soft">{t('auth.requirements.title')}</p>
      <ul className="mt-1.5 grid gap-1 sm:grid-cols-3">
        {RULES.map(({ key, label }) => (
          <li key={key} className={`flex items-center gap-1.5 text-xs transition-colors ${checks[key] ? 'text-ok' : 'text-ink-soft'}`}>
            <span
              className={`grid size-4 shrink-0 place-items-center rounded-full transition-colors ${
                checks[key] ? 'bg-ok text-on-accent' : 'border border-control'
              }`}
            >
              {checks[key] && <Icon name="check" className="size-2.5" strokeWidth={3} />}
            </span>
            {t(label)}
            <span className="sr-only">{t(checks[key] ? 'auth.requirements.met' : 'auth.requirements.unmet')}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
