import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function Modal({ open, title, onClose, children, footer }: ModalProps) {
  const frameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  // Anclar el marco al viewport VISIBLE (no a la pantalla completa) para que,
  // cuando el teclado del móvil sube, el bottom-sheet se apoye encima del teclado
  // en vez de quedar tapado por él. Usa la API visualViewport.
  useEffect(() => {
    if (!open) return
    const vv = window.visualViewport
    if (!vv) return
    const sync = () => {
      const el = frameRef.current
      if (!el) return
      el.style.height = `${vv.height}px`
      el.style.transform = `translateY(${vv.offsetTop}px)`
    }
    sync()
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
    }
  }, [open])

  if (!open) return null

  return (
    <div ref={frameRef} className="fixed inset-x-0 top-0 h-dvh z-50 flex items-end md:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-lg bg-surface border border-border md:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col max-h-full md:max-h-[92vh] animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-primary p-1 rounded-lg" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-5 overflow-y-auto flex-1">
          {children}
        </div>
        {footer && (
          <div className="px-5 py-4 border-t border-border flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
