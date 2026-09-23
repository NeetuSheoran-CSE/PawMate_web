import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MessageCircle, WifiOff } from 'lucide-react'
import Avatar from '../components/ui/Avatar.jsx'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import ChatWindow from '../components/chat/ChatWindow.jsx'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { formatTime } from '../utils/format.js'

const POLL_MS = 4000

export default function Messages() {
  useDocumentTitle('Messages')
  const { user } = useAuth()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [convs, setConvs] = useState(null)
  const [failed, setFailed] = useState(false)
  const activeId = params.get('c')

  const load = useCallback(async () => {
    try {
      setConvs(await api.getConversations(user))
      setFailed(false)
    } catch {
      setFailed(true)
      setConvs(cur => cur ?? [])
    }
  }, [user])

  useEffect(() => { load() }, [load])

  // check for new messages every few seconds while the tab is open
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) load() }, POLL_MS)
    return () => clearInterval(id)
  }, [load])

  const active = convs?.find(c => c.id === activeId)

  const send = async text => {
    try {
      await api.sendMessage(active.id, active.as, text)
      await load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (!convs) return <Spinner label="Loading messages" />

  return (
    <div className="container section-sm">
      <h1 className="h2">Messages</h1>
      {failed && (
        <p className="note note-warn row gap-sm" role="alert">
          <WifiOff size={18} aria-hidden /> We could not refresh your messages. Retrying automatically…
        </p>
      )}
      {convs.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No conversations yet" text="Open a walker's profile and tap Message to start chatting." action={<Button to="/find-walker">Find a walker</Button>} />
      ) : (
        <div className={`messages-layout ${active ? 'has-active' : ''}`}>
          <aside className="card conv-list" aria-label="Conversations">
            {convs.map(c => (
              <button key={c.id} className={`conv ${c.id === activeId ? 'on' : ''}`} onClick={() => setParams({ c: c.id })}>
                <Avatar name={c.otherName} size={44} tone={c.otherName.length} />
                <div className="grow">
                  <strong>{c.otherName}</strong>
                  <p className="muted clamp">{c.last ? c.last.text : 'No messages yet'}</p>
                </div>
                {c.last && <time className="muted small" dateTime={c.last.at}>{formatTime(c.last.at)}</time>}
              </button>
            ))}
          </aside>
          {active ? (
            <ChatWindow key={active.id} conversation={active} myRole={active.as} onSend={send} onBack={() => setParams({})} />
          ) : (
            <div className="card chat-empty"><EmptyState icon={MessageCircle} title="Choose a conversation" text="Pick someone from the list to start chatting." /></div>
          )}
        </div>
      )}
    </div>
  )
}
