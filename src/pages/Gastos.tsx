import { useEffect, useMemo, useState } from 'react'
import { Plus, Edit2, Trash2, Wallet, Search, Download, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useToast } from '@/components/Toast'
import { useConfirm } from '@/components/Confirm'
import Modal from '@/components/Modal'
import MoneyInput from '@/components/MoneyInput'
import MonthSelector from '@/components/MonthSelector'
import Select from '@/components/Select'
import Empty from '@/components/Empty'
import { ListSkeleton } from '@/components/Skeleton'
import { clientKey, currentMonth, downloadCSV, formatMoney, monthRange, relativeDate, shortDate, todayISO } from '@/lib/utils'
import type { Expense } from '@/types/database'

export default function Gastos() {
  const { user } = useAuth()
  const { profile, byType } = useProfile()
  const toast = useToast()
  const confirm = useConfirm()

  const [month, setMonth] = useState(currentMonth())
  const [items, setItems] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [query, setQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

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
    const ok = await confirm({
      title: 'Eliminar gasto',
      message: `¿Seguro que quieres eliminar "${g.description}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!ok) return
    const { error } = await supabase.from('expenses').delete().eq('id', g.id)
    if (error) toast.show(error.message, 'error')
    else { toast.show('Eliminado', 'success'); await load() }
  }

  const categories = byType('expense_category').map(o => o.value)
  const currency = profile?.currency ?? 'COP'

  const filtered = useMemo(() => {
    let result = items
    if (query) {
      const q = clientKey(query)
      result = result.filter(g =>
        clientKey(g.description).includes(q) ||
        clientKey(g.category).includes(q)
      )
    }
    if (filterCategory) result = result.filter(g => g.category === filterCategory)
    return result
  }, [items, query, filterCategory])

  const hasFilters = query || filterCategory

  function handleExport() {
    if (!filtered.length) { toast.show('No hay datos para exportar', 'info'); return }
    downloadCSV(
      filtered.map(g => ({
        Fecha: shortDate(g.date),
        Descripción: g.description,
        Categoría: g.category,
        Valor: Number(g.amount),
        Observaciones: g.notes ?? '',
      })),
      `neta-gastos-${month}.csv`,
    )
    toast.show('Descargando CSV', 'success')
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Gastos</h1>
          <p className="text-muted mt-2">Tu registro de egresos.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="neta-btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <MonthSelector value={month} onChange={setMonth} />
          <div className="flex-1" />
          <button onClick={handleExport} className="neta-btn-ghost px-3 py-2.5 flex items-center gap-1.5 text-sm" title="Exportar CSV">
            <Download size={15} />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button onClick={() => { setEditing(null); setShowForm(true) }} className="md:hidden neta-btn-primary px-4 py-2.5 text-sm flex items-center gap-1.5">
            <Plus size={16} />
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar descripción o categoría"
              className="neta-input pl-9 pr-9 py-2.5 text-sm"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="w-36">
            <Select
              value={filterCategory}
              onChange={setFilterCategory}
              options={[{ value: '', label: 'Todas' }, ...categories.map(c => ({ value: c, label: c }))]}
              placeholder="Categoría"
            />
          </div>
        </div>

        {hasFilters && !loading && (
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{filtered.length} de {items.length} resultados</span>
            <button onClick={() => { setQuery(''); setFilterCategory('') }} className="text-accent hover:underline flex items-center gap-1">
              <X size={11} /> Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : items.length === 0 ? (
        <div className="neta-card">
          <Empty icon={<Wallet size={32} />} title="Aún no hay gastos este mes" hint="Toca «+» para registrar el primero." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="neta-card">
          <Empty title="Sin coincidencias" hint="Prueba con otra búsqueda o limpia los filtros." />
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map(g => (
            <li key={g.id} className="neta-card !p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium truncate">{g.description}</span>
                  <span className="text-xs text-muted">{relativeDate(g.date)}</span>
                </div>
                <div className="text-sm text-muted truncate">{g.category}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-negative">- {formatMoney(Number(g.amount), currency)}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditing(g); setShowForm(true) }} className="text-muted hover:text-primary p-2 rounded-lg"><Edit2 size={15} /></button>
                <button onClick={() => deleteItem(g)} className="text-muted hover:text-negative p-2 rounded-lg"><Trash2 size={15} /></button>
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
          categories={categories}
          currency={currency}
        />
      )}
    </div>
  )
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
    if (!category) { toast.show('Configura tus opciones en Configuración', 'error'); return }
    if (amount <= 0) { toast.show('Ingresa un valor válido', 'error'); return }
    setBusy(true)
    const payload = { user_id: user.id, date, description: description.trim(), category, amount, notes: notes.trim() || null }
    const { error } = editing
      ? await supabase.from('expenses').update(payload).eq('id', editing.id)
      : await supabase.from('expenses').insert(payload)
    setBusy(false)
    if (error) toast.show(error.message, 'error')
    else { toast.show(editing ? 'Actualizado' : 'Registrado', 'success'); onSaved() }
  }

  return (
    <Modal open title={editing ? 'Editar gasto' : 'Nuevo gasto'} onClose={onClose}
      footer={<>
        <button type="button" onClick={onClose} className="neta-btn-ghost">Cancelar</button>
        <button type="submit" form="exp-form" disabled={busy} className="neta-btn-primary flex items-center gap-2">
          {busy && <Loader2 size={16} className="animate-spin" />} Guardar
        </button>
      </>}>
      <form id="exp-form" onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="neta-label">Fecha</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="neta-input" />
          </div>
          <div>
            <label className="neta-label">Categoría</label>
            {categories.length === 0
              ? <p className="text-xs text-negative bg-negative/10 border border-negative/20 rounded-xl px-3 py-2.5">Configura en Configuración</p>
              : <Select value={category} onChange={setCategory} options={categories} />}
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
