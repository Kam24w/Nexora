import { useI18n } from '../../context/I18nContext'
import { useTheme } from '../../context/ThemeContext'
import { Icon } from '../ui/Icon'

/** Interruptor de modo claro / oscuro. */
export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()
  const { t } = useI18n()

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={t(isDark ? 'nav.switchToLight' : 'nav.switchToDark')}
      title={t(isDark ? 'nav.switchToLight' : 'nav.switchToDark')}
      onClick={toggleTheme}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-soft transition hover:bg-surface-muted hover:text-ink"
    >
      <Icon name={isDark ? 'moon' : 'sun'} className="size-[18px] text-brand" />
      <span className="flex-1 text-left">{t(isDark ? 'nav.themeDark' : 'nav.themeLight')}</span>
      <span
        aria-hidden="true"
        className={`relative h-5 w-9 rounded-full transition-colors ${isDark ? 'bg-brand' : 'bg-control'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform ${
            isDark ? 'translate-x-4' : ''
          }`}
        />
      </span>
    </button>
  )
}
