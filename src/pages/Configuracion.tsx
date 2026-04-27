import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/contexts/ProfileContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/Toast'
import MoneyInput from '@/components/MoneyInput'
import Select from '@/components/Select'
import type { OptionType, UserOption } from '@/types/database'

const CURRENCIES = [
  { code: 'COP', name: 'Peso colombiano' },
  { code: 'USD', name: 'Dólar estadounidense' },
  { code: 'ARS', name: 'Peso argentino' },
  { code: 'MXN', name: 'Peso mexicano' },
  { code: 'VES', name: 'Bolívar venezolano' },
  { code: 'EUR', name: 'Euro' },
]

const SECTIONS: { type: OptionType; title: string; hint: string }[] = [
  { type: 'procedure', title: 'Mis procedimientos', hint: 'Los servicios que ofreces' },
  { type: 'payment_method', title: 'Métodos de pago', hint: 'Cómo te pagan tus clientes' },
  { type: 'client_source', title: 'Origen del cliente', hint: 'De dónde llegan tus clientes' },
  { type: 'expense_category', title: 'Categorías de gastos', hint: 'Para clasificar tus egresos' },
]

export default function Configuracion() {
  const { profile, updateProfile, refresh } = useProfile()
  const toast = useToast()

  const [businessName, setBusinessName] = useState(profile?.business_name ?? '')
  const [currency, setCurrency] = useState(profile?.currency ?? 'COP')
  const [goal, setGoal] = useState<number>(profile?.monthly_goal ?? 0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setBusinessName(profile?.business_name ?? '')
    setCurrency(profile?.currency ?? 'COP')
    setGoal(profile?.monthly_goal ?? 0)
  }, [profile])

  async function saveProfile() {
    setSaving(true)
    try {
      await updateProfile({
        business_name: businessName.trim() || null,
        currency,
        monthly_goal: goal,
      })
      toast.show('Cambios guardados', 'success')
    } catch (e: any) {
      toast.show(e.message ?? 'Error', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="hidden md:block">
        <h1 className="text-3xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-muted mt-2">Personaliza tu espacio de trabajo.</p>
      </div>

      <div className="neta-card space-y-5">
        <h2 className="text-lg font-semibold">Mi negocio</h2>
        <div>
          <label className="neta-label">Nombre del negocio</label>
          <input
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            placeholder="Ej. Lina PMU Studio"
            className="neta-input"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="neta-label">Moneda</label>
            <Select
              value={currency}
              onChange={setCurrency}
              options={CURRENCIES.map(c => ({ value: c.code, label: `${c.code} — ${c.name}` }))}
            />
          </div>
          <div>
            <label className="neta-label">Meta mensual de ingresos</label>
            <MoneyInput value={goal} onChange={setGoal} currency={currency} />
          </div>
        </div>
      </div>

      {SECTIONS.map(s => (
        <OptionsSection key={s.type} type={s.type} title={s.title} hint={s.hint} onChanged={refresh} />
      ))}

      <div className="sticky bottom-20 md:bottom-6 z-10">
        <button onClick={saveProfile} disabled={saving} className="neta-btn-primary w-full md:w-auto md:px-10 flex items-center justify-center gap-2 shadow-2xl">
          {saving && <Loader2 size={16} className="animate-spin" />}
          Guardar
        </button>
      </div>
    </div>
  )
}

function OptionsSection({ type, title, hint, onChanged }: { type: OptionType; title: string; hint: string; onChanged: () => void }) {
  const { user } = useAuth()
  const { byType } = useProfile()
  const toast = useToast()
  const items = byType(type)

  const [adding, setAdding] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')

  async function addItem() {
    const value = adding.trim()
    if (!value || !user) return
    const order = items.length
    const { error } = await supabase.from('user_options').insert({ user_id: user.id, type, value, order })
    if (error) toast.show(error.message, 'error')
    else {
      setAdding('')
      await onChanged()
    }
  }

  async function deleteItem(opt: UserOption) {
    if (!confirm(`¿Eliminar "${opt.value}"?`)) return
    const { error } = await supabase.from('user_options').delete().eq('id', opt.id)
    if (error) toast.show(error.message, 'error')
    else {
      toast.show('Eliminado', 'success')
      await onChanged()
    }
  }

  async function saveEdit(opt: UserOption) {
    const value = editingValue.trim()
    if (!value) return
    const { error } = await supabase.from('user_options').update({ value }).eq('id', opt.id)
    if (error) toast.show(error.message, 'error')
    else {
      setEditingId(null)
      await onChanged()
    }
  }

  return (
    <div className="neta-card">
      <div className="mb-4">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-xs text-muted mt-1">{hint}</p>
      </div>

      <ul className="space-y-2">
        {items.map(opt => (
          <li key={opt.id} className="flex items-center gap-2 bg-bg border border-border rounded-xl px-3 py-2">
            {editingId === opt.id ? (
              <>
                <input
                  autoFocus
                  value={editingValue}
                  onChange={e => setEditingValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(opt); if (e.key === 'Escape') setEditingId(null) }}
                  className="flex-1 bg-transparent focus:outline-none text-sm"
                />
                <button onClick={() => saveEdit(opt)} className="text-positive p-2 hover:bg-positive/10 rounded-lg"><Check size={16} /></button>
                <button onClick={() => setEditingId(null)} className="text-muted p-2 hover:bg-surface rounded-lg"><X size={16} /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{opt.value}</span>
                <button onClick={() => { setEditingId(opt.id); setEditingValue(opt.value) }} className="text-muted hover:text-primary p-2 rounded-lg" aria-label="Editar">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => deleteItem(opt)} className="text-muted hover:text-negative p-2 rounded-lg" aria-label="Eliminar">
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="flex gap-2 mt-4">
        <input
          value={adding}
          onChange={e => setAdding(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addItem() }}
          placeholder="Agregar nuevo"
          className="neta-input flex-1"
        />
        <button onClick={addItem} disabled={!adding.trim()} className="neta-btn-primary px-4 flex items-center gap-1">
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
