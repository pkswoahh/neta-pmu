import { useEffect, useMemo, useState } from 'react'
import { Loader2, Check, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { translateError } from '@/lib/errors'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useToast } from '@/components/Toast'
import Modal from '@/components/Modal'
import MoneyInput from '@/components/MoneyInput'
import Select from '@/components/Select'
import ClientNameInput from '@/components/ClientNameInput'
import PhoneInput from '@/components/PhoneInput'
import { aggregateClients, type ClientStats } from '@/lib/clients'
import { clientKey, todayISO } from '@/lib/utils'
import type { Procedure } from '@/types/database'

// Valores con los que abrir el formulario ya rellenado (lo usa la Agenda al
// "atender" una cita: pasa cliente, celular, tipo y fecha planeados).
export interface ProcedurePrefill {
  date?: string
  clientName?: string
  clientPhone?: string
  procedureType?: string
}

interface Props {
  editing: Procedure | null
  onClose: () => void
  // Recibe el id del procedimiento guardado (para que la Agenda lo enlace).
  onSaved: (procedureId?: string) => void
  procedures: string[]
  payments: string[]
  sources: string[]
  currency: string
  prefill?: ProcedurePrefill
}

export default function ProcedureForm({ editing, onClose, onSaved, procedures, payments, sources, currency, prefill }: Props) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const toast = useToast()

  const [date, setDate] = useState(editing?.date ?? prefill?.date ?? todayISO())
  const [clientName, setClientName] = useState(editing?.client_name ?? prefill?.clientName ?? '')
  const [clientPhone, setClientPhone] = useState(editing?.client_phone ?? prefill?.clientPhone ?? '')
  const [procType, setProcType] = useState(editing?.procedure_type ?? prefill?.procedureType ?? procedures[0] ?? '')
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
    const { data, error } = editing
      ? await supabase.from('procedures').update(payload).eq('id', editing.id).select('id').single()
      : await supabase.from('procedures').insert(payload).select('id').single()
    setBusy(false)
    if (error) toast.show(translateError(error), 'error')
    else { toast.show(editing ? 'Actualizado' : 'Registrado', 'success'); onSaved((data as { id: string } | null)?.id) }
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
            <PhoneInput value={clientPhone} onChange={setClientPhone} defaultCountry={profile?.country ?? null} placeholder="Opcional" />
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
