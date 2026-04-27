import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Wallet, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useToast } from '@/components/Toast'
import Modal from '@/components/Modal'
import MoneyInput from '@/components/MoneyInput'
import MonthSelector from '@/components/MonthSelector'
import Select from '@/components/Select'
import Empty from '@/components/Empty'
import { currentMonth, formatMoney, monthRange, todayISO } from '@/lib/utils'
import type { Expense } from '@/types/database'

export default function Gastos() {
  const { user } = useAuth()
  const { profile, byType } = useProfile()
  const toast = useToast()

  const [month, setMonth] = useState(currentMonth())
  const [items, setItems] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)

  async function load() {
    if (!user) return
    setLoading(true)
    const { start, end } = monthRange(month)
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', start)
      .lt('date', end)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) toast.show(error.message, 'error')
    else setItems((data ?? []) as Expense[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [user, month])

  async function deleteItem(g: Expense) {
    if (!confirm(`¿Eliminar "${g.description}"?`)) return
    const { error } = await supabase.from('expenses').delete().eq('id', g.id)
    if (error) toast.show(error.message, 'error')
    else {
      toast.show('Eliminado', 'success')
      await load()
    }
  }

  const currency = profile?.currency ?? 'COP'

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Gastos</h1>
          <p className="text-muted mt-2">Tu registro de egresos.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="neta-btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <MonthSelector value={month} onChange={setMonth} />
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="md:hidden neta-btn-primary px-4 py-2.5 text-sm flex items-center gap-1.5">
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-14 text-muted"><Loader2 className="animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="neta-card">
          <Empty
            icon={<Wallet size={32} />}
            title="Aún no hay gastos este mes"
            hint="Toca «Nuevo» para registrar el primero."
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map(g => (
            <li key={g.id} className="neta-card !p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium truncate">{g.description}</span>
                  <span className="text-xs text-muted">{formatDateShort(g.date)}</span>
                </div>
                <div className="text-sm text-muted truncate">{g.category}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-negative">- {formatMoney(Number(g.amount), currency)}</div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button onClick={() => { setEditing(g); setShowForm(true) }} className="text-muted hover:text-primary p-2 rounded-lg" aria-label="Editar"><Edit2 size={15} /></button>
                <button onClick={() => deleteItem(g)} className="text-muted hover:text-negative p-2 rounded-lg" aria-label="Eliminar"><Trash2 size={15} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <ExpenseForm
          editing={editing}
          onClose={() => setShowForm(false)}
          onSaved={async () => { setShowForm(false); await load() }}
          categories={byType('expense_category').map(o => o.value)}
          currency={currency}
        />
      )}
    </div>
  )
}

function formatDateShort(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

interface FormProps {
  editing: Expense | null
  onClose: () => void
  onSaved: () => void
  categories: string[]
  currency: string
}

function ExpenseForm({ editing, onClose, onSaved, categories, currency }: FormProps) {
  const { user } = useAuth()
  const toast = useToast()

  const [date, setDate] = useState(editing?.date ?? todayISO())
  const [description, setDescription] = useState(editing?.description ?? '')
  const [category, setCategory] = useState(editing?.category ?? categories[0] ?? '')
  const [amount, setAmount] = useState<number>(editing?.amount ? Number(editing.amount) : 0)
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!category) {
      toast.show('Configura tus opciones en Configuración', 'error')
      return
    }
    if (amount <= 0) {
      toast.show('Ingresa un valor válido', 'error')
      return
    }
    setBusy(true)
    const payload = {
      user_id: user.id,
      date,
      description: description.trim(),
      category,
      amount,
      notes: notes.trim() || null,
    }
    let error
    if (editing) {
      ({ error } = await supabase.from('expenses').update(payload).eq('id', editing.id))
    } else {
      ({ error } = await supabase.from('expenses').insert(payload))
    }
    setBusy(false)
    if (error) toast.show(error.message, 'error')
    else {
      toast.show(editing ? 'Actualizado' : 'Registrado', 'success')
      onSaved()
    }
  }

  return (
    <Modal
      open
      title={editing ? 'Editar gasto' : 'Nuevo gasto'}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="neta-btn-ghost">Cancelar</button>
          <button type="submit" form="exp-form" disabled={busy} className="neta-btn-primary flex items-center gap-2">
            {busy && <Loader2 size={16} className="animate-spin" />}
            Guardar
          </button>
        </>
      }
    >
      <form id="exp-form" onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="neta-label">Fecha</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="neta-input" />
          </div>
          <div>
            <label className="neta-label">Categoría</label>
            {categories.length === 0 ? (
              <p className="text-xs text-negative bg-negative/10 border border-negative/20 rounded-xl px-3 py-2.5">Configura tus opciones en Configuración</p>
            ) : (
              <Select value={category} onChange={setCategory} options={categories} />
            )}
          </div>
        </div>
        <div>
          <label className="neta-label">Descripción</label>
          <input required value={description} onChange={e => setDescription(e.target.value)} className="neta-input" placeholder="Ej. Pigmento Permablend" />
        </div>
        <div>
          <label className="neta-label">Valor</label>
          <MoneyInput value={amount} onChange={setAmount} currency={currency} required />
        </div>
        <div>
          <label className="neta-label">Observaciones (opcional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="neta-input min-h-[80px] resize-none" />
        </div>
      </form>
    </Modal>
  )
}
