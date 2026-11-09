import { useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../context/I18nContext'
import { validateEmail, validateOnServer, validatePassword, type AuthFieldErrors } from '../../services/authValidation'
import type { AuthErrorCode } from '../../types/auth'
import type { TranslationKey } from '../../types/i18n'
import { LanguageSwitcher } from '../layout/LanguageSwitcher'
import { ThemeToggle } from '../layout/ThemeToggle'
import { Icon } from '../ui/Icon'
import { Logo, LogoMark } from '../ui/LogoMark'
import { Spinner } from '../ui/Spinner'
import { TextField } from './TextField'

type Mode = 'signIn' | 'signUp' | 'reset'

const COPY: Readonly<Record<Mode, { title: TranslationKey; subtitle: TranslationKey; submit: TranslationKey }>> = {
  signIn: { title: 'auth.signInTitle', subtitle: 'auth.signInSubtitle', submit: 'auth.signIn' },
  signUp: { title: 'auth.signUpTitle', subtitle: 'auth.signUpSubtitle', submit: 'auth.signUp' },
  reset: { title: 'auth.resetTitle', subtitle: 'auth.resetSubtitle', submit: 'auth.sendResetLink' },
}

export function AuthScreen() {
  const { signIn, signUp, resetPassword, isConfigured, enterLocalMode } = useAuth()
  const { t } = useI18n()
  const [mode, setMode] = useState<Mode>('signIn')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({})
  const [formError, setFormError] = useState<AuthErrorCode | null>(isConfigured ? null : 'notConfigured')
  const [notice, setNotice] = useState<TranslationKey | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const switchMode = (next: Mode) => {
    setMode(next)
    setFieldErrors({})
    setNotice(null)
    setFormError(isConfigured ? null : 'notConfigured')
  }

  const validate = (): AuthFieldErrors => {
    const errors: AuthFieldErrors = {}
    if (mode === 'signUp' && !fullName.trim()) errors.fullName = 'auth.validation.nameRequired'
    const emailError = validateEmail(email)
    if (emailError) errors.email = emailError
    const passwordError = mode === 'reset' ? null : validatePassword(password)
    if (passwordError) errors.password = passwordError
    return errors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    const errors = validate()
    setFieldErrors(errors)
    setNotice(null)
    if (Object.keys(errors).length) return

    setSubmitting(true)
    setFormError(null)
    try {
      const checked = await validateOnServer({ mode, email, password, fullName })
      if (!checked.ok) {
        setFieldErrors(checked.errors)
        return
      }

      if (mode === 'signIn') {
        const result = await signIn({ email: checked.email, password })
        if (!result.ok) setFormError(result.error)
      } else if (mode === 'signUp') {
        const result = await signUp({ email: checked.email, password, fullName: checked.fullName })
        if (!result.ok) setFormError(result.error)
        else if (result.data.requiresEmailConfirmation) {
          setMode('signIn')
          setPassword('')
          setNotice('auth.checkEmail')
        }
      } else {
        const result = await resetPassword(checked.email)
        if (!result.ok) setFormError(result.error)
        else setNotice('auth.resetSent')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const copy = COPY[mode]

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="card grid w-full max-w-5xl overflow-hidden lg:grid-cols-[1.05fr_1fr]">
        {/* Panel de marca */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-[#0b3c52] via-[#0a6f86] to-[#13b8ad] p-10 text-white lg:flex">
          <div aria-hidden="true" className="absolute -top-24 -right-24 size-80 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden="true" className="absolute -bottom-32 -left-16 size-96 rounded-full bg-[#1fe0cc]/20 blur-3xl" />
          <div className="relative flex items-center gap-2.5">
            <span className="grid size-11 place-items-center rounded-xl bg-white/95 shadow-lg">
              <LogoMark className="size-8" />
            </span>
            <span className="font-display text-2xl font-bold tracking-[-0.05em]">{t('common.appName')}</span>
          </div>
          <div className="relative">
            <p className="text-xs font-bold tracking-[0.18em] text-white/70 uppercase">{t('auth.tagline')}</p>
            <h1 className="mt-3 max-w-sm font-display text-4xl leading-[1.1] font-bold tracking-[-0.04em]">{t('auth.heroTitle')}</h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">{t('auth.heroDescription')}</p>
          </div>
          <ul className="relative grid grid-cols-3 gap-3" aria-hidden="true">
            {(['cpu', 'memory', 'disk'] as const).map((icon) => (
              <li key={icon} className="grid place-items-center rounded-xl bg-white/10 py-4 ring-1 ring-white/15 backdrop-blur">
                <Icon name={icon} className="size-6 text-white/90" />
              </li>
            ))}
          </ul>
        </section>

        {/* Formulario */}
        <section className="flex flex-col gap-7 p-6 sm:p-10">
          <div className="flex items-center justify-between gap-3">
            <span className="lg:hidden">
              <Logo label={t('common.appName')} />
            </span>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-32">
                <LanguageSwitcher />
              </div>
              <div className="w-36">
                <ThemeToggle />
              </div>
            </div>
          </div>

          <header>
            <h2 className="font-display text-2xl font-bold tracking-[-0.035em] text-ink">{t(copy.title)}</h2>
            <p className="mt-1 text-sm text-muted">{t(copy.subtitle)}</p>
          </header>

          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'signUp' && (
              <TextField
                label={t('auth.fullName')}
                icon="profile"
                autoComplete="name"
                placeholder={t('auth.fullNamePlaceholder')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={fieldErrors.fullName && t(fieldErrors.fullName)}
              />
            )}
            <TextField
              label={t('auth.email')}
              icon="mail"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email && t(fieldErrors.email)}
            />
            {mode !== 'reset' && (
              <TextField
                label={t('auth.password')}
                icon="lock"
                type="password"
                autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={fieldErrors.password && t(fieldErrors.password)}
              />
            )}

            {mode === 'signIn' && (
              <button
                type="button"
                onClick={() => switchMode('reset')}
                className="self-end text-xs font-semibold text-brand-strong hover:underline"
              >
                {t('auth.forgotPassword')}
              </button>
            )}

            {formError && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-crit-soft p-3 text-sm text-crit">
                <Icon name="alert" className="mt-0.5 size-4" />
                {t(`auth.errors.${formError}`)}
              </p>
            )}
            {notice && (
              <p role="status" className="flex items-start gap-2 rounded-xl bg-ok-soft p-3 text-sm text-ok">
                <Icon name="check" className="mt-0.5 size-4" />
                {t(notice)}
              </p>
            )}

            <button type="submit" disabled={submitting || !isConfigured} className="btn-primary mt-1 w-full disabled:cursor-not-allowed">
              {submitting ? <Spinner /> : <Icon name="arrowRight" className="size-4" />}
              {t(copy.submit)}
            </button>
          </form>

          <p className="text-center text-sm text-muted">
            {mode === 'signIn' ? (
              <>
                {t('auth.noAccount')}{' '}
                <button type="button" onClick={() => switchMode('signUp')} className="font-semibold text-brand-strong hover:underline">
                  {t('auth.signUp')}
                </button>
              </>
            ) : mode === 'signUp' ? (
              <>
                {t('auth.haveAccount')}{' '}
                <button type="button" onClick={() => switchMode('signIn')} className="font-semibold text-brand-strong hover:underline">
                  {t('auth.signIn')}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => switchMode('signIn')} className="font-semibold text-brand-strong hover:underline">
                {t('auth.backToSignIn')}
              </button>
            )}
          </p>

          {enterLocalMode && (
            <button
              type="button"
              onClick={enterLocalMode}
              className="rounded-xl border border-dashed border-line px-4 py-2.5 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand-strong"
            >
              {t('auth.continueLocal')}
            </button>
          )}
        </section>
      </div>
    </div>
  )
}
