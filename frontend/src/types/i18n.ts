import type es from '../i18n/es.json'

/** El español es el idioma fuente: su forma define el contrato que debe cumplir cada traducción. */
export type TranslationSchema = typeof es

/** Todas las rutas hoja del JSON en notación de puntos, p. ej. `scan.start.basic`. */
type LeafPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : LeafPaths<T[K], `${Prefix}${K}.`>
}[keyof T & string]

export type TranslationKey = LeafPaths<TranslationSchema>

export type TranslationParams = Readonly<Record<string, string | number>>

/** Mensaje traducible: una clave con parámetros, o texto literal cuando no hay traducción conocida. */
export type Message = { key: TranslationKey; params?: TranslationParams } | { raw: string }
