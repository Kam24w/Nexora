/**
 * Cliente HTTP del servicio local de Nexora (server.py).
 *
 * Única fuente de la URL base: todos los servicios (telemetría, IA) pasan por aquí.
 */

export const DEFAULT_API_BASE_URL = 'http://127.0.0.1:5000'

const resolveBaseUrl = (configured: string | undefined): string => {
  const value = configured?.trim()
  if (!value) return DEFAULT_API_BASE_URL

  try {
    const url = new URL(value)
    return url.origin + url.pathname.replace(/\/+$/, '')
  } catch {
    if (import.meta.env.DEV) console.warn(`[Nexora] VITE_DIAGNOSIS_API_URL inválida ("${value}"); se usa ${DEFAULT_API_BASE_URL}`)
    return DEFAULT_API_BASE_URL
  }
}

export const API_BASE_URL = resolveBaseUrl(import.meta.env.VITE_DIAGNOSIS_API_URL)
