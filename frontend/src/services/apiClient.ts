/**
 * Cliente HTTP del servicio local de Nexora (server.py).
 *
 * Única fuente de la URL base: todos los servicios (telemetría, IA) pasan por aquí.
 * Flask escucha solo en IPv4 (127.0.0.1); `localhost` puede resolverse a ::1 en
 * Windows/macOS y fallar, por eso se fuerza siempre 127.0.0.1.
 */

export const DEFAULT_API_BASE_URL = 'http://127.0.0.1:5000'

const resolveBaseUrl = (configured: string | undefined): string => {
  const value = configured?.trim()
  if (!value) return DEFAULT_API_BASE_URL

  try {
    const url = new URL(value)
    if (url.hostname === 'localhost' || url.hostname === '[::1]') url.hostname = '127.0.0.1'
    return url.origin + url.pathname.replace(/\/+$/, '')
  } catch {
    if (import.meta.env.DEV) console.warn(`[Nexora] VITE_DIAGNOSIS_API_URL inválida ("${value}"); se usa ${DEFAULT_API_BASE_URL}`)
    return DEFAULT_API_BASE_URL
  }
}

export const API_BASE_URL = resolveBaseUrl(import.meta.env.VITE_DIAGNOSIS_API_URL)

/**
 * - offline: no hay conexión con el servicio (no está en ejecución, puerto distinto o CORS).
 * - timeout: el servicio no respondió a tiempo.
 * - http: el servicio respondió con un código de error.
 */
export type ApiErrorKind = 'offline' | 'timeout' | 'http'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  readonly body: unknown

  constructor(kind: ApiErrorKind, options: { status?: number; body?: unknown; cause?: unknown } = {}) {
    super(`API ${kind}${options.status ? ` ${options.status}` : ''}`, { cause: options.cause })
    this.name = 'ApiError'
    this.kind = kind
    this.status = options.status ?? null
    this.body = options.body ?? null
  }
}

export const isAbortError = (error: unknown): boolean => error instanceof DOMException && error.name === 'AbortError'

interface RequestOptions {
  method?: 'GET' | 'POST'
  /** Se serializa como JSON. */
  json?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  timeoutMs: number
}

/**
 * Realiza la petición y devuelve el cuerpo JSON. Lanza `ApiError` en errores de red,
 * timeout o códigos HTTP de error; re-lanza el `AbortError` si la cancela el llamador.
 */
export async function apiRequest<T = unknown>(path: string, options: RequestOptions): Promise<T> {
  const timeout = AbortSignal.timeout(options.timeoutMs)
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers }
  if (options.json !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.json !== undefined ? JSON.stringify(options.json) : undefined,
      signal,
    })
  } catch (error) {
    if (options.signal?.aborted) throw error
    if (timeout.aborted) throw new ApiError('timeout', { cause: error })
    throw new ApiError('offline', { cause: error })
  }

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    /* cuerpo vacío o no JSON */
  }

  if (!response.ok) throw new ApiError('http', { status: response.status, body })
  return body as T
}
