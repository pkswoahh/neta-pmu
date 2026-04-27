import { useEffect, useMemo, useState } from 'react'
import { Plus, Edit2, Trash2, ClipboardList, Search, Download, X, Loader2 } from 'lucide-react'
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
import ClientHistoryModal from '@/components/ClientHistoryModal'
import { clientKey, currentMonth, downloadCSV, formatMoney, monthLabel, monthRange, relativeDate, shortDate, todayISO } from '@/lib/utils'
import type { Procedure } from '@/types/database'

export default function Procedimientos() {
  const { user } = useAuth()
  const { profile, byType } = useProfile()
  const toast = useToast()
  const confirm = useConfirm()

  const [month, setMonth] = useState(currentMonth())
  const [items, setItems] = useState<Procedure[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Procedure | null>(null)
  const [historyClient, setHistoryClient] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filterType, setFilterType] = useState('')

  async function load() {
    if (!user) return
    setLoading(true)
    const { start, end } = monthRange(month)
    const { data, error } = await supabase
      .from('procedures')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', start)
      .lt('date', end)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) toast.show(error.message, 'error')
    else setItems((data ?? []) as Procedure[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [user, month])

  async function deleteItem(p: Procedure) {
    const ok = await confirm({
      title: 'Eliminar procedimiento',
      message: `¿Seguro que quieres eliminar el procedimiento de ${p.client_name}? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!ok) return
    const { error } = await supabase.from('procedures').delete().eq('id', p.id)
    if (error) toast.show(error.message, 'error')
    else { toast.show('Eliminado', 'success'); await load() }
  }

  const procedureTypes = byType('procedure').map(o => o.value)
  const currency = profile?.currency ?? 'COP'

  const filtered = useMemo(() => {
    let result = items
    if (query) {
      const q = clientKey(query)
      result = result.filter(p =>
        clientKey(p.client_name).includes(q) ||
        clientKey(p.procedure_type).includes(q)
      )
    }
    if (filterType) result = result.filter(p => p.procedure_type === filterType)
    return result
  }, [items, query, filterType])

  const hasFilters = query || filterType

  function handleExport() {
    if (!filtered.length) { toast.show('No hay datos para exportar', 'info'); return }
    downloadCSV(
      filtered.map(p => ({
        Fecha: shortDate(p.date),
        Cliente: p.client_name,
        Celular: p.client_phone ?? '',
        Procedimiento: p.procedure_type,
        Valor: Number(p.amount),
        'Método de pago': p.payment_method,
        Origen: p.client_source,
        Observaciones: p.notes ?? '',
      })),
      `neta-procedimientos-${month}.csv`,
    )
    toast.show('Descargando CSV', 'success')
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Procedimientos</h1>
          <p className="text-muted mt-2">Tu registro diario de servicios.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="neta-btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {/* Barra de herramientas */}
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
              placeholder="Buscar cliente o procedimiento"
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
              value={filterType}
              onChange={setFilterType}
              options={[{ value: '', label: 'Todos' }, ...procedureTypes.map(t => ({ value: t, label: t }))]}
              placeholder="Tipo"
            />
          </div>
        </div>

        {hasFilters && !loading && (
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{filtered.length} de {items.length} resultados</span>
            <button onClick={() => { setQuery(''); setFilterType('') }} className="text-accent hover:underline flex items-center gap-1">
              <X size={11} /> Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : items.length === 0 ? (
        <div className="neta-card">
          <Empty icon={<ClipboardList size={32} />} title="Aún no hay procedimientos este mes" hint="Toca «+» para registrar el primero." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="neta-card">
          <Empty title="Sin coincidencias" hint="Prueba con otra búsqueda o limpia los filtros." />
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map(p => (
            <li key={p.id} className="neta-card !p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <button type="button" onClick={() => setHistoryClient(p.client_name)} className="font-medium truncate hover:text-accent transition-colors text-left">
                    {p.client_name}
                  </button>
                  <span className="text-xs text-muted">{relativeDate(p.date)}</span>
                </div>
                <div className="text-sm text-muted truncate">{p.procedure_type} · {p.payment_method}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold">{formatMoney(Number(p.amount), currency)}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditing(p); setShowForm(true) }} className="text-muted hover:text-primary p-2 rounded-lg"><Edit2 size={15} /></button>
                <button onClick={() => deleteItem(p)} className="text-muted hover:text-negative p-2 rounded-lg"><Trash2 size={15} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {historyClient && (
        <ClientHistoryModal open clientName={historyClient} onClose={() => setHistoryClient(null)} />
      )}
      {showForm && (
        <ProcedureForm
          editing={editing}
          onClose={() => setShowForm(false)}
          onSaved={async () => { setShowForm(false); await load() }}
          procedures={procedureTypes}
          payments={byType('payment_method').map(o => o.value)}
          sources={byType('client_source').map(o => o.value)}
          currency={currency}
        />
      )}
    </div>
  )
}

interface FormProps {
  editing: Procedure | null
  onClose: () => void
  onSaved: () => void
  procedures: string[]
  payments: string[]
  sources: string[]
  currency: string
}

function ProcedureForm({ editing, onClose, onSaved, procedures, payments, sources, currency }: FormProps) {
  const { user } = useAuth()
  const toast = useToast()

  const [date, setDate] = useState(editing?.date ?? todayISO())
  const [clientName, setClientName] = useState(editing?.client_name ?? '')
  const [clientPhone, setClientPhone] = useState(editing?.client_phone ?? '')
  const [procType, setProcType] = useState(editing?.procedure_type ?? procedures[0] ?? '')
  const [amount, setAmount] = useState<number>(editing?.amount ? Number(editing.amount) : 0)
  const [payment, setPayment] = useState(editing?.payment_method ?? payments[0] ?? '')
  const [source, setSource] = useState(editing?.client_source ?? sources[0] ?? '')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!procType || !payment || !source) { toast.show('Configura tus opciones en Configuración', 'error'); return }
    if (amount <= 0) { toast.show('Ingresa un valor válido', 'error'); return }
    setBusy(true)
    const payload = { user_id: user.id, date, client_name: clientName.trim(), client_phone: clientPhone.trim() || null, procedure_type: procType, amount, payment_method: payment, client_source: source, notes: notes.trim() || null }
    const { error } = editing
      ? await supabase.from('procedures').update(payload).eq('id', editing.id)
      : await supabase.from('procedures').insert(payload)
    setBusy(false)
    if (error) toast.show(error.message, 'error')
    else { toast.show(editing ? 'Actualizado' : 'Registrado', 'success'); onSaved() }
  }

  return (
    <Modal open title={editing ? 'Editar procedimiento' : 'Nuevo procedimiento'} onClose={onClose}
      footer={<>
        <button type="button" onClick={onClose} className="neta-btn-ghost">Cancelar</button>
        <button type="submit" form="proc-form" disabled={busy} className="neta-btn-primary flex items-center gap-2">
          {busy && <Loader2 size={16} className="animate-spin" />} Guardar
        </button>
      </>}>
      <form id="proc-form" onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="neta-label">Fecha</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="neta-input" />
          </div>
          <div>
            <label className="neta-label">Procedimiento</label>
            {procedures.length === 0
              ? <p className="text-xs text-negative bg-negative/10 border border-negative/20 rounded-xl px-3 py-2.5">Configura en Configuración</p>
              : <Select value={procType} onChange={setProcType} options={procedures} />}
          </div>
        </div>
        <div>
          <label className="neta-label">Nombre del cliente</label>
          <input required value={clientName} onChange={e => setClientName(e.target.value)} className="neta-input" placeholder="Ej. María Pérez" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="neta-label">Celular (opcional)</label>
            <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="neta-input" placeholder="Opcional" />
          </div>
          <div>
            <label className="neta-label">Valor cobrado</label>
            <MoneyInput value={amount} onChange={setAmount} currency={currency} required />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="neta-label">Método de pago</label>
            {payments.length === 0
              ? <p className="text-xs text-negative bg-negative/10 border border-negative/20 rounded-xl px-3 py-2.5">Configura en Configuración</p>
              : <Select value={payment} onChange={setPayment} options={payments} />}
          </div>
          <div>
            <label className="neta-label">Origen del cliente</label>
            {sources.length === 0
              ? <p className="text-xs text-negative bg-negative/10 border border-negative/20 rounded-xl px-3 py-2.5">Configura en Configuración</p>
              : <Select value={source} onChange={setSource} options={sources} />}
          </div>
        </div>
        <div>
          <label className="neta-label">Observaciones (opcional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="neta-input min-h-[80px] resize-none" />
        </div>
      </form>
    </Modal>
  )
}
