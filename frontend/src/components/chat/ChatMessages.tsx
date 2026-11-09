import { useEffect, useRef } from 'react'
import { useI18n } from '../../context/I18nContext'
import type { ChatMessage } from '../../hooks/useReportChat'
import { Icon } from '../ui/Icon'
import { LogoMark } from '../ui/LogoMark'

/** Conversación con desplazamiento automático al último mensaje. */
export function ChatMessages({ messages, sending }: { messages: readonly ChatMessage[]; sending: boolean }) {
  const { t, formatDate } = useI18n()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, sending])

  return (
    <ol aria-label={t('chat.conversation')} aria-live="polite" className="flex flex-col gap-4">
      {messages.map((message) => {
        const mine = message.role === 'user'
        return (
          <li key={message.id} className={`flex animate-fade-in gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
            {!mine && (
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft" aria-hidden="true">
                <LogoMark className="size-5" />
              </span>
            )}
            <div className={`flex max-w-[85%] flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
              <span className="sr-only">{t(mine ? 'chat.you' : 'chat.assistant')}:</span>
              <p
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  mine ? 'rounded-br-md bg-brand text-on-accent' : 'rounded-bl-md bg-surface-muted text-ink'
                }`}
              >
                {message.content}
              </p>
              <span className="flex items-center gap-1 text-[0.7rem] text-ink-soft">
                {formatDate(message.createdAt, { timeStyle: 'short' })}
                {!message.saved && (
                  <span className="flex items-center gap-0.5" title={t('chat.notSaved')}>
                    · <Icon name="cloud" className="size-3" />
                    <span className="sr-only">{t('chat.notSaved')}</span>
                  </span>
                )}
              </span>
            </div>
          </li>
        )
      })}

      {sending && (
        <li className="flex gap-2.5" aria-label={t('chat.thinking')}>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft" aria-hidden="true">
            <LogoMark className="size-5" />
          </span>
          <span className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-surface-muted px-4 py-3" aria-hidden="true">
            {[0, 150, 300].map((delay) => (
              <span key={delay} className="size-1.5 animate-bounce rounded-full bg-ink-soft" style={{ animationDelay: `${delay}ms` }} />
            ))}
          </span>
        </li>
      )}
      <div ref={endRef} />
    </ol>
  )
}
