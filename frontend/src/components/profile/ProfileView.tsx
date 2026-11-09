import { useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../context/I18nContext'
import { FULL_NAME_MAX_LENGTH, PASSWORD_MAX_LENGTH, validatePassword } from '../../services/authValidation'
import type { AuthErrorCode } from '../../types/auth'
import type { TranslationKey } from '../../types/i18n'
import { TextField } from '../auth/TextField'
import { LanguageSwitcher } from '../layout/LanguageSwitcher'
import { ThemeToggle } from '../layout/ThemeToggle'
import { useReports } from '../reports/useReports'
import { Avatar } from '../ui/Avatar'
import { Icon, type IconName } from '../ui/Icon'
import { Spinner } from '../ui/Spinner'
import { HardwareSection } from './HardwareSection'

type Feedback = { kind: 'ok'; key: TranslationKey } | { kind: 'error'; key: TranslationKey } | null

const authError = (code: AuthErrorCode): Feedback => ({ kind: 'error', key: `auth.errors.${code}` })

/** Vista "Perfil": datos de la cuenta de Supabase, estadísticas y preferencias. */
export function ProfileView() {
  const { user, status, signOut } = useAuth()
  const { t, formatDate } = useI18n()
  const isLocal = status === 'local' || !user
  const displayName = user?.fullName ?? user?.email ?? t('nav.localUser')

  return (
    <main className="flex min-w-0 flex-col gap-5">
      <header className="px-1">
        <p className="eyebrow">{t('profile.eyebrow')}</p>
        <h1 className="mt-1 font-display text-[1.75rem] leading-tight font-bold tracking-[-0.04em] text-ink">{t('profile.title')}</h1>
      </header>

      <section className="card relative overflow-hidden p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          <Avatar name={displayName} size="xl" />
          <div className="min-w-0">
            <h2 className="truncate font-display text-2xl font-bold tracking-[-0.03em] text-ink">{displayName}</h2>
            {user?.email && <p className="truncate text-sm text-ink-soft">{user.email}</p>}
            <p className="mt-1 text-xs text-muted">
              {isLocal
                ? t('nav.localMode')
                : user.createdAt && t('profile.memberSince', { date: formatDate(user.createdAt, { dateStyle: 'long' }) })}
            </p>
          </div>
        </div>
      </section>

      {isLocal ? (
        <p className="card flex items-center gap-3 p-5 text-sm text-ink-soft">
          <Icon name="alert" className="size-5 text-warn" />
          {t('profile.localMode')}
        </p>
      ) : (
        <>
          <ProfileStats />
          <div className="grid items-start gap-5 xl:grid-cols-2">
            <AccountForm initialName={user.fullName ?? ''} email={user.email} />
            <PasswordForm />
          </div>
        </>
      )}

      <HardwareSection />

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <Section icon="globe" title={t('profile.preferences.title')} description={t('profile.preferences.description')}>
          <div className="flex flex-col gap-2 sm:max-w-sm">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </Section>
        <Section icon="logout" title={t('profile.session.title')} description={t('profile.session.description')}>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex items-center gap-2 self-start rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-crit/40 hover:bg-crit-soft hover:text-crit"
          >
            <Icon name="logout" className="size-4" />
            {t('nav.signOut')}
          </button>
        </Section>
      </div>
    </main>
  )
}

function ProfileStats() {
  const { t, formatNumber, formatRelativeTime } = useI18n()
  const { state } = useReports(true)
  const reports = state.status === 'ready' ? state.reports : []
  const loading = state.status === 'loading'
  const average = reports.length
    ? reports.reduce((sum, report) => sum + report.payload.health_score, 0) / reports.length
    : null
  const latest = reports[0]?.createdAt

  const stats: ReadonlyArray<{ icon: IconName; label: string; value: string }> = [
    { icon: 'reports', label: t('profile.stats.reports'), value: formatNumber(reports.length) },
    {
      icon: 'sparkles',
      label: t('profile.stats.avgScore'),
      value: average === null ? t('profile.stats.none') : `${formatNumber(average, { maximumFractionDigits: 0 })}${t('diagnosis.health.outOf')}`,
    },
    { icon: 'history', label: t('profile.stats.lastReport'), value: latest ? formatRelativeTime(new Date(latest)) : t('profile.stats.none') },
  ]

  return (
    <section aria-busy={loading} className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="card flex items-center gap-3 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-strong">
            <Icon name={stat.icon} className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted">{stat.label}</p>
            <p className="truncate font-display text-xl font-semibold text-ink tabular-nums">
              {loading ? <Spinner className="size-4 text-muted" /> : state.status === 'error' ? t('profile.stats.none') : stat.value}
            </p>
          </div>
        </div>
      ))}
    </section>
  )
}

function AccountForm({ initialName, email }: { initialName: string; email: string }) {
  const { updateProfile } = useAuth()
  const { t } = useI18n()
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const unchanged = name.trim() === initialName.trim()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) {
      setFeedback({ kind: 'error', key: 'auth.validation.nameRequired' })
      return
    }
    setSaving(true)
    const result = await updateProfile(name)
    setSaving(false)
    setFeedback(result.ok ? { kind: 'ok', key: 'profile.account.saved' } : authError(result.error))
  }

  return (
    <Section icon="profile" title={t('profile.account.title')}>
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label={t('profile.account.name')}
          icon="profile"
          autoComplete="name"
          maxLength={FULL_NAME_MAX_LENGTH}
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setFeedback(null)
          }}
        />
        <div className="flex flex-col gap-1.5">
          <TextField label={t('profile.account.email')} icon="mail" type="email" value={email} readOnly disabled />
          <p className="text-xs text-muted">{t('profile.account.emailHint')}</p>
        </div>
        <FormFooter feedback={feedback} saving={saving} disabled={unchanged} label={t('profile.account.save')} />
      </form>
    </Section>
  )
}

function PasswordForm() {
  const { updatePassword } = useAuth()
  const { t } = useI18n()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [fieldError, setFieldError] = useState<{ password?: TranslationKey; confirm?: TranslationKey }>({})

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors: typeof fieldError = {}
    const passwordError = validatePassword(password)
    if (passwordError) errors.password = passwordError
    else if (password !== confirm) errors.confirm = 'profile.password.mismatch'
    setFieldError(errors)
    setFeedback(null)
    if (Object.keys(errors).length) return

    setSaving(true)
    const result = await updatePassword(password)
    setSaving(false)
    if (result.ok) {
      setPassword('')
      setConfirm('')
      setFeedback({ kind: 'ok', key: 'profile.password.saved' })
    } else {
      setFeedback(authError(result.error))
    }
  }

  return (
    <Section icon="lock" title={t('profile.password.title')}>
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label={t('profile.password.new')}
          icon="lock"
          type="password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldError.password && t(fieldError.password)}
        />
        <TextField
          label={t('profile.password.confirm')}
          icon="lock"
          type="password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          error={fieldError.confirm && t(fieldError.confirm)}
        />
        <FormFooter feedback={feedback} saving={saving} disabled={!password} label={t('profile.password.save')} />
      </form>
    </Section>
  )
}

function FormFooter({ feedback, saving, disabled, label }: { feedback: Feedback; saving: boolean; disabled: boolean; label: string }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p
        role={feedback?.kind === 'error' ? 'alert' : 'status'}
        className={`min-h-5 text-xs ${feedback?.kind === 'error' ? 'text-crit' : 'text-ok'}`}
      >
        {feedback && t(feedback.key)}
      </p>
      <button type="submit" disabled={saving || disabled} className="btn-primary px-4 py-2.5 disabled:cursor-not-allowed">
        {saving ? <Spinner /> : <Icon name="check" className="size-4" />}
        {label}
      </button>
    </div>
  )
}

function Section({ icon, title, description, children }: { icon: IconName; title: string; description?: string; children: ReactNode }) {
  return (
    <section className="card flex flex-col gap-4 p-5">
      <header className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
          <Icon name={icon} className="size-4" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}
