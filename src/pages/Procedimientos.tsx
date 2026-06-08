import { useEffect, useMemo, useState } from 'react'
import { Plus, Edit2, Trash2, ClipboardList, Search, Download, X, Loader2, Phone, Calendar, CreditCard, MapPin, FileText, User, Check, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { translateError } from '@/lib/errors'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useToast } from '@/components/Toast'
import { useConfirm } from '@/components/Confirm'
import Modal from '@/components/Modal'
import MoneyInput from '@/components/MoneyInput'
import PeriodSelector from '@/components/PeriodSelector'
import Select from '@/components/Select'
import Empty from '@/components/Empty'
import { ListSkeleton } from '@/components/Skeleton'
import ClientHistoryModal from '@/components/ClientHistoryModal'
import ClientNameInput from '@/components/ClientNameInput'
import { aggregateClients, type ClientStats } from '@/lib/clients'
import { clientKey, defaultPeriod, downloadCSV, formatMoney, periodRange, periodSlug, relativeDate, shortDate, todayISO, type Period } from '@/lib/utils'
import type { Procedure } from '@/types/database'

export default function Procedimientos() {
  const { user } = useAuth()
  const { profile, byType } = useProfile()
  const toast = useToast()
  const confirm = useConfirm()

  const [period, setPeriod] = useState<Period>(defaultPeriod())
  const [items, setItems] = useState<Procedure[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Procedure | null>(null)
  const [historyClient, setHistoryClient] = useState<string | null>(null)
  const [detail, setDetail] = useState<Procedure | null>(null)
  const [query, setQuery] = useState('')
  const [filterType, setFilterType] = useState('')

  async function load() {
    if (!user) return
    setLoading(true)
    const { start, end } = periodRange(period)
    const { data, error } = await supabase
      .from('procedures')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', start)
      .lt('date', end)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) toast.show(translateError(error), 'error')
    else setItems((data ?? []) as Procedure[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [user, period])

  async function deleteItem(p: Procedure) {
    const ok = await confirm({
      title: 'Eliminar procedimiento',
      message: `¿Seguro que quieres eliminar el procedimiento de ${p.client_name}? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!ok) return
    const { error } = await supabase.from('procedures').delete().eq('id', p.id)
    if (error) toast.show(translateError(error), 'error')
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
  const total = useMemo(() => filtered.reduce((s, p) => s + Number(p.amount), 0), [filtered])

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
      `neta-procedimientos-${periodSlug(period)}.csv`,
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
        <PeriodSelector
          value={period}
          onChange={setPeriod}
          trailing={
            <>
              <button onClick={handleExport} className="neta-btn-ghost px-3 py-2.5 flex items-center gap-1.5 text-sm shrink-0" title="Exportar CSV">
                <Download size={15} />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button onClick={() => { setEditing(null); setShowForm(true) }} className="md:hidden neta-btn-primary px-4 py-2.5 text-sm flex items-center gap-1.5 shrink-0" aria-label="Nuevo procedimiento">
                <Plus size={16} />
              </button>
            </>
          }
        />

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar cliente o procedimiento"
              autoComplete="off"
              autoCorrect="off"
              className="neta-input pl-9 pr-9"
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

      </div>

      {!loading && items.length > 0 && (
        <div className="neta-card !p-3.5 flex items-center justify-between gap-3">
          <div className="text-sm min-w-0">
            <span className="font-medium">{filtered.length} {filtered.length === 1 ? 'cita' : 'citas'}</span>
            {hasFilters && (
              <>
                <span className="text-muted"> de {items.length}</span>
                <button onClick={() => { setQuery(''); setFilterType('') }} className="text-accent hover:underline ml-2 text-xs">Limpiar</button>
              </>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] text-muted uppercase tracking-wider">Total</div>
            <div className="font-semibold text-positive tabular-nums leading-tight">{formatMoney(total, currency)}</div>
          </div>
        </div>
      )}

      {loading ? (
        <ListSkeleton rows={5} />
      ) : items.length === 0 ? (
        <div className="neta-card">
          <Empty icon={<ClipboardList size={32} />} title="Aún no hay procedimientos en este periodo" hint="Toca «+» para registrar el primero, o cambia el periodo arriba." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="neta-card">
          <Empty title="Sin coincidencias" hint="Prueba con otra búsqueda o limpia los filtros." />
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map(p => (
            <li key={p.id} className="neta-card !p-4 flex items-center gap-3">
              <button type="button" onClick={() => setDetail(p)} className="flex-1 min-w-0 flex items-center gap-3 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-medium truncate">{p.client_name}</span>
                    <span className="text-xs text-muted">{relativeDate(p.date)}</span>
                  </div>
                  <div className="text-sm text-muted truncate">
                    <span className="text-accent font-medium">{p.procedure_type}</span> · {p.payment_method}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold text-positive">{formatMoney(Number(p.amount), currency)}</div>
                </div>
              </button>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditing(p); setShowForm(true) }} className="text-muted hover:text-primary p-2 rounded-lg" aria-label="Editar"><Edit2 size={15} /></button>
                <button onClick={() => deleteItem(p)} className="text-muted hover:text-negative p-2 rounded-lg" aria-label="Eliminar"><Trash2 size={15} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {detail && (
        <ProcedureDetailModal
          procedure={detail}
          currency={currency}
          onClose={() => setDetail(null)}
          onEdit={() => { setEditing(detail); setShowForm(true); setDetail(null) }}
          onViewClient={() => { setHistoryClient(detail.client_name); setDetail(null) }}
        />
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

function ProcedureDetailModal({ procedure: p, currency, onClose, onEdit, onViewClient }: {
  procedure: Procedure
  currency: string
  onClose: () => void
  onEdit: () => void
  onViewClient: () => void
}) {
  return (
    <Modal
      open
      title="Detalle de la cita"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="neta-btn-ghost">Cerrar</button>
          <button type="button" onClick={onEdit} className="neta-btn-primary flex items-center gap-2">
            <Edit2 size={15} /> Editar
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="text-center pb-1">
          <div className="text-3xl font-semibold text-positive tabular-nums">{formatMoney(Number(p.amount), currency)}</div>
          <div className="text-sm text-accent font-medium mt-1">{p.procedure_type}</div>
        </div>

        <div className="space-y-3 border-t border-border pt-5">
          <DetailRow icon={<User size={15} />} label="Cliente" value={p.client_name} />
          {p.client_phone && (
            <DetailRow
              icon={<Phone size={15} />}
              label="Celular"
              value={<a href={`tel:${p.client_phone}`} className="text-accent hover:underline">{p.client_phone}</a>}
            />
          )}
          <DetailRow icon={<Calendar size={15} />} label="Fecha" value={`${shortDate(p.date)} · ${relativeDate(p.date)}`} />
          <DetailRow icon={<CreditCard size={15} />} label="Método de pago" value={p.payment_method} />
          <DetailRow icon={<MapPin size={15} />} label="Origen del cliente" value={p.client_source} />
          <DetailRow
            icon={<FileText size={15} />}
            label="Observaciones"
            value={p.notes?.trim() ? p.notes : <span className="text-muted">Sin observaciones</span>}
          />
        </div>

        <button type="button" onClick={onViewClient} className="text-sm text-accent hover:underline">
          Ver historial completo del cliente →
        </button>
      </div>
    </Modal>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted uppercase tracking-wider">{label}</div>
        <div className="mt-0.5 break-words">{value}</div>
      </div>
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
  const [clients, setClients] = useState<ClientStats[]>([])

  // Lista de clientes ya registrados para el autocompletar. Excluimos el
  // procedimiento que se está editando, para no contarlo como "visita previa".
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase.from('procedures').select('*').eq('user_id', user.id)
      if (cancelled) return
      const rows = ((data ?? []) as Procedure[]).filter(p => p.id !== editing?.id)
      setClients(aggregateClients(rows))
    })()
    return () => { cancelled = true }
  }, [user, editing])

  const matchedClient = useMemo(() => {
    const key = clientKey(clientName)
    return key ? clients.find(c => c.key === key) : undefined
  }, [clientName, clients])

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
    if (error) toast.show(translateError(error), 'error')
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
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="neta-input !w-auto" />
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
          <ClientNameInput
            value={clientName}
            onChange={setClientName}
            onSelect={c => { setClientName(c.displayName); if (c.phone) setClientPhone(c.phone) }}
            clients={clients}
          />
          {clientName.trim() && (
            matchedClient ? (
              <p className="text-xs text-positive mt-2 flex items-center gap-1.5">
                <Check size={13} /> Cliente frecuente · {matchedClient.visits} {matchedClient.visits === 1 ? 'cita previa' : 'citas previas'}
              </p>
            ) : (
              <p className="text-xs text-accent mt-2 flex items-center gap-1.5">
                <UserPlus size={13} /> Cliente nuevo
              </p>
            )
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="neta-label">Celular (opcional)</label>
            <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} autoComplete="off" className="neta-input" placeholder="Opcional" />
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
          <textarea value={notes} onChange={e => setNotes(e.target.value)} autoComplete="off" className="neta-input min-h-[80px] resize-none" />
        </div>
      </form>
    </Modal>
  )
}
