import { useState, useCallback, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'

interface ToastItem {
  id: number
  message: string
}

interface ToastContextValue {
  show: (message: string) => void
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function CdsToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((message: string) => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2500)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-9999 flex flex-col items-center gap-2 pointer-events-none">
          {toasts.map(t => (
            <div
              key={t.id}
              className="animate-[slideDown_0.3s_ease-out] pointer-events-auto rounded-lg border border-(--border) bg-(--surface) px-4 py-2.5 shadow-(--shadow-overlay) type-body-sm text-(--text)"
            >
              {t.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}
