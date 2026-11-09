import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_LANGUAGE, resolveMessage, translate } from '../i18n'
import { storage, STORAGE_KEYS } from '../services/storage'
import type { Message, TranslationKey, TranslationParams } from '../types/i18n'
import { LANGUAGES, type Language } from '../types/preferences'
import { I18nContext, type I18nContextValue } from './I18nContext'

const readStoredLanguage = (): Language => {
  const stored = storage.get(STORAGE_KEYS.language)
  return LANGUAGES.find((language) => language === stored) ?? DEFAULT_LANGUAGE
}

const RELATIVE_UNITS: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
  ['second', 1],
]

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    storage.set(STORAGE_KEYS.language, next)
  }, [])

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: TranslationKey, params?: TranslationParams) => translate(language, key, params)
    const numberFormatter = new Intl.NumberFormat(language)
    const relativeFormatter = new Intl.RelativeTimeFormat(language, { numeric: 'auto' })

    return {
      language,
      setLanguage,
      t,
      tm: (message: Message) => resolveMessage(language, message),
      formatNumber: (number, options) =>
        options ? new Intl.NumberFormat(language, options).format(number) : numberFormatter.format(number),
      formatDate: (date, options = { dateStyle: 'medium', timeStyle: 'short' }) => {
        const value = typeof date === 'string' ? new Date(date) : date
        return Number.isNaN(value.getTime()) ? '—' : new Intl.DateTimeFormat(language, options).format(value)
      },
      formatRelativeTime: (date) => {
        const seconds = Math.round((date.getTime() - Date.now()) / 1000)
        const [unit, size] = RELATIVE_UNITS.find(([, s]) => Math.abs(seconds) >= s) ?? ['second', 1]
        return relativeFormatter.format(Math.round(seconds / size), unit)
      },
    }
  }, [language, setLanguage])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
