import { useEffect, useState } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'

// Indicador global de conexión. La app es una SPA con shell precacheado,
// así que siempre abre offline; lo que falla son los datos (Supabase es
// NetworkOnly). Este aviso le explica a la usuaria por qué no carga ni
// guarda, y confirma cuando vuelve la red. No bloquea ningún toque.
export default function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine)
  const [justReconnected, setJustReconnected] = useState(false)

  useEffect(() => {
    function goOffline() { setOnline(false); setJustReconnected(false) }
    function goOnline() { setOnline(true); setJustReconnected(true) }
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  // El "reconectado" se autooculta; el "sin conexión" se queda mientras dure.
  useEffect(() => {
    if (!justReconnected) return
    const t = setTimeout(() => setJustReconnected(false), 2500)
    return () => clearTimeout(t)
  }, [justReconnected])

  if (online && !justReconnected) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed z-[80] left-1/2 -translate-x-1/2 px-2 w-full max-w-xs animate-slide-up pointer-events-none"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}
    >
      <div
        className={cn(
          'flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-2xl backdrop-blur-md border',
          online
            ? 'bg-positive/15 border-positive/30 text-positive'
            : 'bg-amber-400/15 border-amber-400/30 text-amber-200',
        )}
      >
        {online ? <Wifi size={15} className="shrink-0" /> : <WifiOff size={15} className="shrink-0" />}
        {online ? 'Conexión restablecida' : 'Sin conexión a internet'}
      </div>
    </div>
  )
}
