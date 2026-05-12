import { useLocation } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { SUPPORT_WHATSAPP } from '@/lib/constants'

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/procedimientos': 'Procedimientos',
  '/clientes': 'Clientes',
  '/gastos': 'Gastos',
  '/configuracion': 'Configuración',
  '/bienvenida': 'Bienvenida',
  '/suscribirse': 'Suscribirse',
  '/suscripcion-vencida': 'Suscripción vencida',
  '/cuenta-suspendida': 'Cuenta suspendida',
}

export default function SupportButton() {
  const location = useLocation()
  const page = ROUTE_LABELS[location.pathname] ?? 'Neta.'
  const text = `Hola Roberto, estoy usando Neta. (pantalla: ${page}) y `
  const href = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hablar con Roberto por WhatsApp"
      className="fixed z-[80] bottom-24 md:bottom-6 right-4 group"
    >
      <div className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white shadow-lg shadow-black/30 rounded-full pl-3 pr-4 py-3 transition-transform hover:scale-105 active:scale-95">
        <MessageCircle size={20} fill="currentColor" strokeWidth={0} />
        <span className="text-sm font-semibold hidden md:inline">Hablar con Roberto</span>
      </div>
    </a>
  )
}
