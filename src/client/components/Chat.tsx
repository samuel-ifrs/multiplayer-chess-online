import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '@shared/types'
import { useI18n } from '../i18n/I18nProvider'
import styles from './styles/Chat.module.css'

interface ChatProps {
  messages: ChatMessage[]
  onSend: (text: string) => void
}

export function Chat({ messages, onSend }: ChatProps) {
  const { t } = useI18n()
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
  }

  return (
    <div className={styles.chat}>
      <h3 className={styles.title}>{t('chat_title')}</h3>
      <div className={styles.messages} ref={listRef}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.from === 'system' ? styles.system : styles.message}
            data-color={m.from}
          >
            {m.from !== 'system' && <span className={styles.author}>{m.name}</span>}
            <span className={styles.text}>{m.text}</span>
          </div>
        ))}
      </div>
      <form className={styles.form} onSubmit={submit}>
        <input
          className={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('chat_placeholder')}
          maxLength={500}
        />
        <button type="submit" className={styles.send}>
          {t('chat_send')}
        </button>
      </form>
    </div>
  )
}
