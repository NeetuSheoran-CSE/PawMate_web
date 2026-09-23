import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, MessageCircle, Send, ShieldCheck } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { formatTime } from '../../utils/format.js'

export default function ChatWindow({ conversation, myRole, onSend, typing, onBack }) {
  const [text, setText] = useState('')
  const bodyRef = useRef(null)
  const messages = conversation.messages
  const otherName = myRole === 'owner' ? conversation.walkerName : conversation.ownerName

  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, typing])

  const submit = e => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    onSend(value)
    setText('')
  }

  return (
    <section className="chat card">
      <header className="chat-head">
        {onBack && <button className="icon-btn chat-back" aria-label="Back to conversations" onClick={onBack}><ArrowLeft size={20} /></button>}
        <Avatar name={otherName} size={42} tone={otherName.length} />
        <div>
          <h2 className="h5">{otherName}</h2>
          
        </div>
      </header>

      <div className="chat-body" aria-live="polite" ref={bodyRef}>
        {messages.length === 0 && (
          <EmptyState icon={MessageCircle} title="Say hello" text="Ask about availability, your pet's routine, or anything else before you book." />
        )}
        {messages.map(m => (
          <div key={m.id} className={`bubble ${m.from === myRole ? 'mine' : 'theirs'}`}>
            <p>{m.text}</p>
            <time dateTime={m.at}>{formatTime(m.at)}</time>
          </div>
        ))}
        {typing && <div className="bubble theirs typing" aria-label={`${otherName} is typing`}><span /><span /><span /></div>}
      </div>

      <p className="chat-safe"><ShieldCheck size={15} aria-hidden /> Keep chats and payments on PawMate to stay protected.</p>

      <form className="chat-input" onSubmit={submit}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message" aria-label="Message" maxLength={500} />
        <button type="submit" className="btn btn-primary btn-icon" aria-label="Send message" disabled={!text.trim()}>
          <Send size={18} />
        </button>
      </form>
    </section>
  )
}
