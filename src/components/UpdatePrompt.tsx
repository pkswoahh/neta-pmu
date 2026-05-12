import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('SW registration error', error)
    },
  })

  if (!needRefresh) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed z-[90] bottom-40 md:bottom-24 right-4 left-4 md:left-auto md:max-w-sm animate-slide-up"
    >
      <div className="bg-surface/95 backdrop-blur-md border border-accent/30 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center">
          <RefreshCw size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary">Nueva versión disponible</p>
          <p className="text-xs text-muted mt-0.5">Actualiza para ver las últimas mejoras de Neta.</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => updateServiceWorker(true)}
              className="neta-btn-primary text-xs px-3 py-2"
            >
              Actualizar ahora
            </button>
            <button
              onClick={() => setNeedRefresh(false)}
              className="neta-btn-ghost text-xs px-3 py-2"
            >
              Después
            </button>
          </div>
        </div>
        <button
          onClick={() => setNeedRefresh(false)}
          className="shrink-0 text-muted hover:text-primary p-1 rounded-lg"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
