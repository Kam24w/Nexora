import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../context/I18nContext'
import type { TranslationKey } from '../../types/i18n'
import type { AppView } from '../../types/navigation'
import { Avatar } from '../ui/Avatar'
import { Icon, type IconName } from '../ui/Icon'
import { Logo } from '../ui/LogoMark'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'

interface NavEntry {
  view: AppView
  icon: IconName
  label: TranslationKey
}

const NAV: readonly NavEntry[] = [
  { view: 'dashboard', icon: 'dashboard', label: 'nav.dashboard' },
  { view: 'analysis', icon: 'analysis', label: 'nav.analysis' },
  { view: 'reports', icon: 'reports', label: 'nav.reports' },
  { view: 'profile', icon: 'profile', label: 'nav.profile' },
]

interface SidebarProps {
  activeView: AppView
  onNavigate: (view: AppView) => void
}

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
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
        <Avatar name={displayName} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
          {caption && caption !== displayName && <p className="truncate text-xs text-muted">{caption}</p>}
        </div>
      </div>

      <nav aria-label={t('nav.primary')} className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = item.view === activeView
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => onNavigate(item.view)}
              aria-current={active ? 'page' : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                active
                  ? 'bg-brand-soft font-semibold text-brand-strong'
                  : 'text-ink-soft hover:bg-surface-muted hover:text-ink'
              }`}
            >
              <Icon name={item.icon} />
              <span className="flex-1">{t(item.label)}</span>
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
