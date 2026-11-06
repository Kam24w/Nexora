/**
 * Acceso seguro a localStorage. En modo privado, en algunos webviews de escritorio
 * o con el almacenamiento bloqueado, el acceso lanza excepciones.
 */
export const storage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      /* sin almacenamiento: la preferencia vive solo en memoria */
    }
  },
}

/** Claves compartidas con el script anti-parpadeo de index.html. */
export const STORAGE_KEYS = {
  theme: 'nexora.theme',
  language: 'nexora.language',
  authSession: 'nexora.auth',
} as const
