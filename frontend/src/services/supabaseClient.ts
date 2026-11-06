import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { STORAGE_KEYS } from './storage'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Cliente único de Supabase. Es `null` si faltan las variables de entorno, para que
 * la app arranque e informe del problema en lugar de fallar al importar el módulo.
 */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: STORAGE_KEYS.authSession,
        },
      })
    : null
