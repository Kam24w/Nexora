import { useI18n } from '../../context/I18nContext'
import { LANGUAGES } from '../../types/preferences'
import { Icon } from '../ui/Icon'

/** Selector bilingüe segmentado (ES / EN). */
export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n()

  return (
    <div role="radiogroup" aria-label={t('nav.language')} className="flex items-center gap-1 rounded-xl bg-surface-sunken p-1">
      <Icon name="globe" className="mx-1.5 size-4 text-muted" />
      {LANGUAGES.map((code) => {
        const active = code === language
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={active}
            title={t(`languages.${code}`)}
            onClick={() => setLanguage(code)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-bold tracking-wider uppercase transition ${
              active ? 'bg-surface text-brand-strong shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            {code}
          </button>
        )
      })}
    </div>
  )
}
