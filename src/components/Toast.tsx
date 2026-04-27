import { createContext, useCallback, useContext, useEffect, useState } from 'react'

type ToastVariant = 'success' | 'error' | 'info'
interface Toast { id: number; message: string; variant: ToastVariant }

interface ToastCtx {
  show: (message: string, variant?: ToastVariant) => void
}

const Ctx = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, variant }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2000)
  }, [])

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-md border animate-slide-up
              ${t.variant === 'success' ? 'bg-positive/15 border-positive/30 text-positive' : ''}
              ${t.variant === 'error' ? 'bg-negative/15 border-negative/30 text-negative' : ''}
              ${t.variant === 'info' ? 'bg-surface/90 border-border text-primary' : ''}
            `}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function useUnmountToastCleanup() {
  useEffect(() => () => {}, [])
}
