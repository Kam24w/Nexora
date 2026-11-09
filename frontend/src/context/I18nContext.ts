import type { Message, TranslationKey, TranslationParams } from '../types/i18n'
import type { Language } from '../types/preferences'
import { createStrictContext } from './createStrictContext'

export interface I18nContextValue {
  language: Language
  setLanguage: (language: Language) => void
  /** Traduce una clave tipada: una clave inexistente es un error de compilación. */
  t: (key: TranslationKey, params?: TranslationParams) => string
  /** Resuelve un `Message` (clave i18n o texto literal del backend). */
  tm: (message: Message) => string
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
  formatRelativeTime: (date: Date) => string
  /** Fecha absoluta en el formato del idioma activo (por defecto: fecha y hora medias). */
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string
}

export const [I18nContext, useI18n] = createStrictContext<I18nContextValue>('I18n')
