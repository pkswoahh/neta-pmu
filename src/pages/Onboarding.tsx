import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Logo from '@/components/Logo'
import Select from '@/components/Select'
import { useProfile } from '@/contexts/ProfileContext'
import { useToast } from '@/components/Toast'
import { Loader2, ArrowRight } from 'lucide-react'

const CURRENCIES = [
  { code: 'COP', name: 'Peso colombiano' },
  { code: 'USD', name: 'Dólar estadounidense' },
  { code: 'ARS', name: 'Peso argentino' },
  { code: 'MXN', name: 'Peso mexicano' },
  { code: 'VES', name: 'Bolívar venezolano' },
  { code: 'EUR', name: 'Euro' },
]

export default function Onboarding() {
  const { profile, updateProfile, loading } = useProfile()
  const toast = useToast()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('COP')
  const [busy, setBusy] = useState(false)

  if (loading) return null
  if (profile?.business_name) return <Navigate to="/" replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      await updateProfile({ business_name: name.trim(), currency })
      toast.show('Listo. Configura tus opciones cuando quieras', 'success')
      nav('/configuracion', { replace: true })
    } catch (e: any) {
      toast.show(e.message ?? 'Error', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-5 py-10 relative z-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <h1 className="text-2xl font-semibold mt-6">Bienvenida</h1>
          <p className="text-muted mt-2">Vamos a dejar tu espacio listo en 30 segundos.</p>
        </div>

        <form onSubmit={submit} className="neta-card flex flex-col gap-5">
          <div>
            <label className="neta-label">¿Cómo se llama tu negocio?</label>
            <input
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Lina PMU Studio"
              className="neta-input"
            />
          </div>
          <div>
            <label className="neta-label">Moneda</label>
            <Select
              value={currency}
              onChange={setCurrency}
              options={CURRENCIES.map(c => ({ value: c.code, label: `${c.code} — ${c.name}` }))}
            />
          </div>
          <button type="submit" disabled={busy} className="neta-btn-primary flex items-center justify-center gap-2">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <>Continuar <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="text-xs text-muted text-center mt-6">
          Podrás cambiar todo desde Configuración cuando quieras.
        </p>
      </div>
    </div>
  )
}
