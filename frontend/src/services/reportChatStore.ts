import type { ChatTurn } from './reportAssistantService'
import { supabase } from './supabaseClient'

/**
 * Persistencia de las conversaciones en la tabla `report_messages` de Supabase
 * (ver supabase/migrations). RLS garantiza que cada usuario solo lee y escribe
 * mensajes de sus propios informes.
 */

export interface StoredChatMessage extends ChatTurn {
  id: string
  createdAt: string
}

/** missingTable: falta ejecutar la migración de report_messages. */
export type ChatStoreError = 'notConfigured' | 'missingTable' | 'unauthorized' | 'network' | 'unknown'

export type ChatStoreResult<T> = { ok: true; value: T } | { ok: false; error: ChatStoreError }

const MAX_MESSAGES = 200

const toChatError = (code: string | undefined): ChatStoreError => {
  if (!code) return 'network'
  if (code === '42P01' || code === 'PGRST205') return 'missingTable'
  return code === '42501' || code.startsWith('PGRST30') ? 'unauthorized' : 'unknown'
}

const toMessage = (row: { id: unknown; role: unknown; content: unknown; created_at: unknown }): StoredChatMessage | null =>
  (row.role === 'user' || row.role === 'assistant') && typeof row.content === 'string'
    ? { id: String(row.id), role: row.role, content: row.content, createdAt: String(row.created_at) }
    : null

export const reportChatStore = {
  async list(reportId: string): Promise<ChatStoreResult<StoredChatMessage[]>> {
    if (!supabase) return { ok: false, error: 'notConfigured' }
    try {
      const { data, error } = await supabase
        .from('report_messages')
        .select('id, role, content, created_at')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true })
        .limit(MAX_MESSAGES)
      if (error) return { ok: false, error: toChatError(error.code) }
      return { ok: true, value: (data ?? []).flatMap((row) => toMessage(row) ?? []) }
    } catch {
      return { ok: false, error: 'network' }
    }
  },

  async add(reportId: string, userId: string, turn: ChatTurn): Promise<ChatStoreResult<StoredChatMessage>> {
    if (!supabase) return { ok: false, error: 'notConfigured' }
    try {
      const { data, error } = await supabase
        .from('report_messages')
        .insert({ report_id: reportId, user_id: userId, role: turn.role, content: turn.content })
        .select('id, role, content, created_at')
        .single()
      if (error) return { ok: false, error: toChatError(error.code) }
      const message = toMessage(data)
      return message ? { ok: true, value: message } : { ok: false, error: 'unknown' }
    } catch {
      return { ok: false, error: 'network' }
    }
  },

  async clear(reportId: string): Promise<ChatStoreResult<null>> {
    if (!supabase) return { ok: false, error: 'notConfigured' }
    try {
      const { error } = await supabase.from('report_messages').delete().eq('report_id', reportId)
      return error ? { ok: false, error: toChatError(error.code) } : { ok: true, value: null }
    } catch {
      return { ok: false, error: 'network' }
    }
  },
}
