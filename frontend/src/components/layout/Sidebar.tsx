import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../context/I18nContext'
import type { TranslationKey } from '../../types/i18n'
import { Icon, type IconName } from '../ui/Icon'
import { Logo } from '../ui/LogoMark'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'

interface NavEntry {
  id: string
  icon: IconName
  label: TranslationKey
  available: boolean
}

const NAV: readonly NavEntry[] = [
  { id: 'dashboard', icon: 'dashboard', label: 'nav.dashboard', available: true },
  { id: 'analysis', icon: 'analysis', label: 'nav.analysis', available: false },
  { id: 'reports', icon: 'reports', label: 'nav.reports', available: false },
  { id: 'profile', icon: 'profile', label: 'nav.profile', available: false },
]

const initials = (name: string) =>
  name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

export function Sidebar() {
  const { user, status, signOut } = useAuth()
  const { t } = useI18n()
  const displayName = user?.fullName ?? user?.email ?? t('nav.localUser')
  const caption = status === 'local' ? t('nav.localMode') : user?.email

  return (
    <aside className="card flex flex-col gap-6 p-5 lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]">
      <div className="px-1.5 pt-1">
        <Logo label={t('common.appName')} />
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-surface-muted p-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-linear-to-br from-[#16c4b4] to-[#0a7fa3] font-display text-sm font-bold text-white ring-4 ring-brand-soft">
          {initials(displayName) || '·'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
          {caption && caption !== displayName && <p className="truncate text-xs text-muted">{caption}</p>}
        </div>
      </div>

      <nav aria-label={t('nav.primary')} className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = item.id === 'dashboard'
          return (
            <button
              key={item.id}
              type="button"
              disabled={!item.available}
              aria-current={active ? 'page' : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                active
                  ? 'bg-brand-soft font-semibold text-brand-strong'
                  : 'text-ink-soft enabled:hover:bg-surface-muted enabled:hover:text-ink disabled:cursor-not-allowed disabled:opacity-60'
              }`}
            >
              <Icon name={item.icon} />
              <span className="flex-1">{t(item.label)}</span>
              {!item.available && (
                <span className="rounded-md bg-surface-sunken px-1.5 py-0.5 text-[0.6rem] font-bold tracking-wider text-muted uppercase">
                  {t('nav.soon')}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-line pt-5">
        <p className="eyebrow px-1.5 pb-1">{t('nav.preferences')}</p>
        <LanguageSwitcher />
        <ThemeToggle />
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-crit/40 hover:bg-crit-soft hover:text-crit"
        >
          <Icon name="logout" className="size-4" />
          {t('nav.signOut')}
        </button>
      </div>
    </aside>
  )
}
