import { useId, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useI18n } from '../../context/I18nContext'
import { Icon } from '../ui/Icon'
import { Spinner } from '../ui/Spinner'

/** Mismo límite que el servidor (diagnosis/report_assistant.py). */
export const MAX_QUESTION_LENGTH = 1000

/** Caja de pregunta: Enter envía, Mayús+Enter añade una línea. */
export function ChatComposer({ onSend, sending }: { onSend: (text: string) => void; sending: boolean }) {
  const { t } = useI18n()
  const [text, setText] = useState('')
  const hintId = useId()
  const empty = !text.trim()

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (empty || sending) return
    onSend(text)
    setText('')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5">
      <div className="flex items-end gap-2 rounded-2xl border border-control bg-surface p-2 transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand-soft">
        <label htmlFor={`${hintId}-input`} className="sr-only">
          {t('chat.placeholder')}
        </label>
        <textarea
          id={`${hintId}-input`}
          rows={2}
          value={text}
          maxLength={MAX_QUESTION_LENGTH}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t('chat.placeholder')}
          aria-describedby={hintId}
          className="max-h-40 min-h-11 flex-1 resize-y bg-transparent px-2 py-1.5 text-sm text-ink outline-none placeholder:text-muted"
        />
        <button type="submit" disabled={empty || sending} aria-label={t('chat.send')} title={t('chat.send')} className="btn-primary size-10 shrink-0 rounded-xl p-0">
          {sending ? <Spinner /> : <Icon name="arrowRight" className="size-4 -rotate-90" />}
        </button>
      </div>
      <p id={hintId} className="flex justify-between gap-3 px-1 text-[0.7rem] text-ink-soft">
        <span>{t('chat.hint')}</span>
        <span className="tabular-nums">
          {text.length}/{MAX_QUESTION_LENGTH}
        </span>
      </p>
    </form>
  )
}
