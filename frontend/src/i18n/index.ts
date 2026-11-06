import type { Language } from '../types/preferences'
import type { Message, TranslationKey, TranslationParams, TranslationSchema } from '../types/i18n'
import en from './en.json'
import es from './es.json'

/** El tipado obliga a que cada idioma tenga exactamente las mismas claves que es.json. */
export const dictionaries: Readonly<Record<Language, TranslationSchema>> = { es, en }

export const DEFAULT_LANGUAGE: Language = 'es'

const resolve = (dictionary: TranslationSchema, key: TranslationKey): string | undefined => {
  let node: unknown = dictionary
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined
    node = (node as Record<string, unknown>)[part]
  }
  return typeof node === 'string' ? node : undefined
}

/** Traduce una clave interpolando `{{param}}`; recurre al idioma por defecto y, en último caso, a la clave. */
export const translate = (language: Language, key: TranslationKey, params?: TranslationParams): string => {
  const template = resolve(dictionaries[language], key) ?? resolve(dictionaries[DEFAULT_LANGUAGE], key) ?? key
  if (!params) return template
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

/** Resuelve un `Message`: una clave i18n se traduce; el texto literal se devuelve tal cual. */
export const resolveMessage = (language: Language, message: Message): string =>
  'raw' in message ? message.raw : translate(language, message.key, message.params)
