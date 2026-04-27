import { createContext, useCallback, useContext, useRef, useState } from 'react'
import Modal from './Modal'
import { cn } from '@/lib/utils'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const Ctx = createContext<ConfirmFn | null>(null)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((v: boolean) => void) | null>(null)

  const confirm: ConfirmFn = useCallback((o) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
      setOpts(o)
    })
  }, [])

  const close = (value: boolean) => {
    resolverRef.current?.(value)
    resolverRef.current = null
    setOpts(null)
  }

  const isDanger = opts?.variant === 'danger'

  return (
    <Ctx.Provider value={confirm}>
      {children}
      {opts && (
        <Modal
          open
          title={opts.title}
          onClose={() => close(false)}
          footer={
            <>
              <button type="button" onClick={() => close(false)} className="neta-btn-ghost">
                {opts.cancelLabel ?? 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={cn(
                  'rounded-xl px-5 py-3 font-semibold transition disabled:opacity-50',
                  isDanger
                    ? 'bg-negative/15 text-negative border border-negative/30 hover:bg-negative/25'
                    : 'bg-accent text-bg hover:opacity-90',
                )}
              >
                {opts.confirmLabel ?? 'Confirmar'}
              </button>
            </>
          }
        >
          <p className="text-sm text-muted leading-relaxed">{opts.message}</p>
        </Modal>
      )}
    </Ctx.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
