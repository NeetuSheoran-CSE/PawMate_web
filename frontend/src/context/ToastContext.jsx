import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'

const ToastContext = createContext(null)
const ICONS = { success: CheckCircle2, error: CircleAlert, info: Info }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), [])

  const push = useCallback((message, type) => {
    const id = `${Date.now()}${Math.random()}`
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500)
  }, [])

  const api = useMemo(
    () => ({
      success: m => push(m, 'success'),
      error: m => push(m, 'error'),
      info: m => push(m, 'info'),
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map(t => {
          const Icon = ICONS[t.type]
          return (
            <div key={t.id} className={`toast toast-${t.type}`}>
              <Icon size={20} />
              <p>{t.message}</p>
              <button className="icon-btn" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
