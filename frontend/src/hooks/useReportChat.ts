import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/I18nContext'
import type { AIFailureReason } from '../services/aiErrors'
import { reportAssistantService, type ChatTurn } from '../services/reportAssistantService'
import { reportChatStore, type ChatStoreError } from '../services/reportChatStore'
import type { StoredReport } from '../services/reportsService'

/** Turnos que se envían a la IA como contexto (el servidor también limita). */
const HISTORY_SENT = 12

export interface ChatMessage extends ChatTurn {
  id: string
  createdAt: string
  /** false si no se pudo guardar en Supabase (sigue visible en esta sesión). */
  saved: boolean
}

let localId = 0
const draft = (turn: ChatTurn): ChatMessage => ({ ...turn, id: `local-${++localId}`, createdAt: new Date().toISOString(), saved: false })

/**
 * Conversación con la IA sobre un informe: carga el historial guardado, envía las
 * preguntas con el contexto reciente y guarda cada mensaje en `report_messages`.
 */
export function useReportChat(report: StoredReport) {
  const { session } = useAuth()
  const { language } = useI18n()
  const userId = session?.user.id
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [failure, setFailure] = useState<AIFailureReason | null>(null)
  const [storeError, setStoreError] = useState<ChatStoreError | null>(null)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => {
    let active = true
    reportChatStore.list(report.id).then((result) => {
      if (!active) return
      if (result.ok) setMessages(result.value.map((message) => ({ ...message, saved: true })))
      else setStoreError(result.error)
      setLoading(false)
    })
    return () => {
      active = false
      controller.current?.abort()
    }
  }, [report.id])

  const persist = useCallback(
    async (message: ChatMessage) => {
      if (!userId) return
      const result = await reportChatStore.add(report.id, userId, message)
      if (result.ok) {
        setMessages((current) => current.map((item) => (item.id === message.id ? { ...result.value, saved: true } : item)))
      } else {
        setStoreError(result.error)
      }
    },
    [report.id, userId],
  )

  const send = useCallback(
    async (text: string) => {
      const question = text.trim()
      if (!question || sending) return
      const history: ChatTurn[] = messages.slice(-HISTORY_SENT).map(({ role, content }) => ({ role, content }))
      const userMessage = draft({ role: 'user', content: question })

      setFailure(null)
      setSending(true)
      setMessages((current) => [...current, userMessage])
      void persist(userMessage)

      controller.current = new AbortController()
      try {
        const result = await reportAssistantService.ask(report.payload, history, question, language, controller.current.signal)
        if (!result.ok) {
          setFailure(result.reason)
          return
        }
        const answer = draft({ role: 'assistant', content: result.value })
        setMessages((current) => [...current, answer])
        void persist(answer)
      } catch {
        // AbortError al salir de la vista: no hay nada que mostrar.
      } finally {
        setSending(false)
      }
    },
    [messages, sending, persist, report.payload, language],
  )

  const clear = useCallback(async () => {
    const result = await reportChatStore.clear(report.id)
    if (!result.ok) {
      setStoreError(result.error)
      return false
    }
    setMessages([])
    setFailure(null)
    return true
  }, [report.id])

  return { messages, loading, sending, failure, storeError, send, clear }
}
