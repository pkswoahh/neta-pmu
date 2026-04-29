import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import Logo from '@/components/Logo'

interface Props {
  title: string
  updated: string
  children: React.ReactNode
}

export default function LegalPage({ title, updated, children }: Props) {
  const navigate = useNavigate()

  function goBack() {
    if (window.history.length > 1) navigate(-1)
    else navigate('/login')
  }

  return (
    <div className="min-h-dvh px-5 py-10 relative z-10">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Logo size="lg" />
        </div>

        <button
          onClick={goBack}
          className="flex items-center gap-1 text-sm text-muted hover:text-primary transition-colors mb-6"
        >
          <ChevronLeft size={16} />
          Volver
        </button>

        <div className="neta-card space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-xs text-muted mt-1">Última actualización: {updated}</p>
          </div>

          <hr className="border-border" />

          <div className="space-y-6 text-sm leading-relaxed">
            {children}
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-6 pb-4">
          Neta. — Tu negocio, claro como el agua.
        </p>
      </div>
    </div>
  )
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-primary">{title}</h2>
      {children}
    </div>
  )
}

export function LegalText({ children }: { children: React.ReactNode }) {
  return <p className="text-muted">{children}</p>
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside space-y-1 text-muted">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  )
}
