import { useEffect, useMemo, useState } from 'react'
import { Plus, CalendarDays, Clock, Phone, FileText, Loader2, Check, UserPlus, Edit2, Trash2, ClipboardCheck, Ban, MessageCircle, UserX } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { translateError } from '@/lib/errors'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useToast } from '@/components/Toast'
import { useConfirm } from '@/components/Confirm'
import Modal from '@/components/Modal'
import Select from '@/components/Select'
import Empty from '@/components/Empty'
import { ListSkeleton } from '@/components/Skeleton'
import ClientNameInput from '@/components/ClientNameInput'
import PhoneInput from '@/components/PhoneInput'
import ProcedureForm from '@/components/ProcedureForm'
import { aggregateClients, type ClientStats } from '@/lib/clients'
import { whatsappLink, renderReminder } from '@/lib/whatsapp'
import { addDaysISO, clientKey, relativeDate, shortDate, todayISO } from '@/lib/utils'
import type { Appointment, Procedure } from '@/types/database'

// Hora 'HH:MM(:SS)' → '9:30 a.m.' Devuelve null si no hay hora.
function formatTime(t: string | null): string | null {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  const period = h < 12 ? 'a.m.' : 'p.m.'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

const DOW = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MON = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const MON_ABBR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// Fecha legible para el mensaje: "miércoles 11 de junio".
function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${DOW[new Date(y, m - 1, d).getDay()]} ${d} de ${MON[m - 1]}`
}

// Fecha compacta para las tarjetas: "11 jun".
function shortDM(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${d} ${MON_ABBR[m - 1]}`
}

// Link de WhatsApp con el recordatorio armado. Usa la plantilla personalizada
// del perfil si existe; si no, un mensaje por defecto que omite las partes
// vacías (procedimiento/hora/negocio) para que suene natural. null si no hay
// celular usable.
function reminderUrl(a: Appointment, businessName: string | null, template: string | null): string | null {
  if (!a.client_phone) return null
  const nombre = a.client_name.trim().split(/\s+/)[0]
  const hora = formatTime(a.time)
  let msg: string
  const custom = template?.trim()
  if (custom) {
    msg = renderReminder(custom, {
      nombre,
      procedimiento: a.procedure_type ?? '',
      fecha: longDate(a.date),
      hora: hora ?? '',
      negocio: businessName ?? '',
    })
  } else {
    const proc = a.procedure_type ? ` de ${a.procedure_type}` : ''
    const cuando = `el ${longDate(a.date)}${hora ? ` a las ${hora}` : ''}`
    const negocio = businessName ? ` Te espero en ${businessName}.` : ''
    msg = `¡Hola ${nombre}! 😊 Te recuerdo tu cita${proc} ${cuando}.${negocio} Cualquier cosa me escribes por aquí. ¡Nos vemos! 💕`
  }
  return whatsappLink(a.client_phone, msg)
}

// Ordena por fecha y luego por hora; las citas sin hora van al final del día.
function byDateTime(a: Appointment, b: Appointment): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1
  if (!a.time) return b.time ? 1 : 0
  if (!b.time) return -1
  return a.time < b.time ? -1 : a.time > b.time ? 1 : 0
}

export default function Agenda() {
  const { user } = useAuth()
  const { profile, byType } = useProfile()
  const toast = useToast()
  const confirm = useConfirm()

  const [items, setItems] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [detail, setDetail] = useState<Appointment | null>(null)
  const [registering, setRegistering] = useState<Appointment | null>(null)

  async function load() {
    if (!user) return
    setLoading(true)
    // Traemos lo agendado a futuro/atrasado completo, y el historial reciente
    // (atendidas/canceladas de los últimos 60 días) para no crecer sin tope.
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .or(`status.eq.scheduled,date.gte.${addDaysISO(todayISO(), -60)}`)
      .order('date', { ascending: true })
    if (error) toast.show(translateError(error), 'error')
    else setItems((data ?? []) as Appointment[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [user])

  const today = todayISO()
  const tomorrow = addDaysISO(today, 1)

  const groups = useMemo(() => {
    const scheduled = items.filter(a => a.status === 'scheduled')
    return {
      overdue: scheduled.filter(a => a.date < today).sort(byDateTime),
      today: scheduled.filter(a => a.date === today).sort(byDateTime),
      tomorrow: scheduled.filter(a => a.date === tomorrow).sort(byDateTime),
      upcoming: scheduled.filter(a => a.date > tomorrow).sort(byDateTime),
      history: items.filter(a => a.status !== 'scheduled').sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 20),
    }
  }, [items, today, tomorrow])

  async function deleteAppt(a: Appointment) {
    const ok = await confirm({
      title: 'Eliminar cita',
      message: `¿Eliminar la cita de ${a.client_name}? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!ok) return
    const { error } = await supabase.from('appointments').delete().eq('id', a.id)
    if (error) toast.show(translateError(error), 'error')
    else { toast.show('Eliminada', 'success'); setDetail(null); await load() }
  }

  async function cancelAppt(a: Appointment) {
    const ok = await confirm({
      title: 'Cancelar cita',
      message: `¿Marcar como cancelada la cita de ${a.client_name}? Quedará en el historial.`,
      confirmLabel: 'Marcar cancelada',
    })
    if (!ok) return
    const { error } = await supabase.from('appointments').update({ status: 'canceled' }).eq('id', a.id)
    if (error) toast.show(translateError(error), 'error')
    else { toast.show('Cita cancelada', 'success'); setDetail(null); await load() }
  }

  async function markNoShow(a: Appointment) {
    const ok = await confirm({
      title: 'Marcar "No vino"',
      message: `¿${a.client_name} no se presentó? La cita quedará en el historial como "No vino".`,
      confirmLabel: 'Sí, no vino',
    })
    if (!ok) return
    const { error } = await supabase.from('appointments').update({ status: 'no_show' }).eq('id', a.id)
    if (error) toast.show(translateError(error), 'error')
    else { toast.show('Marcada como "No vino"', 'success'); setDetail(null); await load() }
  }

  // "Registrar atención" para una cita futura es raro (no la has atendido aún):
  // avisamos. Si confirma, el procedimiento se guarda con la fecha de hoy.
  async function handleRegister(a: Appointment) {
    if (a.date > today) {
      const ok = await confirm({
        title: 'Esta cita aún no llega',
        message: `La cita es para el ${shortDate(a.date)}. Lo normal es registrar la atención el día que atiendes. ¿Registrarla de todos modos? Se guardará con la fecha de hoy.`,
        confirmLabel: 'Registrar de todos modos',
      })
      if (!ok) return
    }
    setRegistering(a)
    setDetail(null)
  }

  // Tras registrar el procedimiento, enlazamos la cita y la marcamos atendida.
  async function markDone(a: Appointment, procedureId?: string) {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'done', procedure_id: procedureId ?? null })
      .eq('id', a.id)
    if (error) toast.show(translateError(error), 'error')
    setRegistering(null)
    await load()
  }

  const currency = profile?.currency ?? 'COP'
  const hasAny = items.length > 0

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-muted mt-1 md:mt-2 text-sm md:text-base">Tus próximas citas, claras.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="neta-btn-primary flex items-center gap-2 px-4 py-2.5 text-sm shrink-0">
          <Plus size={16} /> <span className="hidden sm:inline">Agendar</span>
        </button>
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : !hasAny ? (
        <div className="neta-card">
          <Empty icon={<CalendarDays size={32} />} title="No tienes citas agendadas" hint="Toca «Agendar» para crear la primera y que Neta te la recuerde." />
        </div>
      ) : (
        <div className="space-y-6">
          <Group title="Atrasadas" tone="warn" appts={groups.overdue} showDate currency={currency} onTap={setDetail} />
          <Group title="Hoy" appts={groups.today} currency={currency} onTap={setDetail} />
          <Group title="Mañana" appts={groups.tomorrow} currency={currency} onTap={setDetail} />
          <Group title="Próximas" appts={groups.upcoming} showDate currency={currency} onTap={setDetail} />
          <Group title="Historial" appts={groups.history} showDate muted currency={currency} onTap={setDetail} />
        </div>
      )}

      {detail && (
        <AppointmentDetail
          appt={detail}
          waUrl={reminderUrl(detail, profile?.business_name ?? null, profile?.reminder_template ?? null)}
          onClose={() => setDetail(null)}
          onRegister={() => handleRegister(detail)}
          onEdit={() => { setEditing(detail); setShowForm(true); setDetail(null) }}
          onCancel={() => cancelAppt(detail)}
          onNoShow={() => markNoShow(detail)}
          onDelete={() => deleteAppt(detail)}
        />
      )}

      {showForm && (
        <AppointmentForm
          editing={editing}
          procedures={byType('procedure').map(o => o.value)}
          onClose={() => setShowForm(false)}
          onSaved={async () => { setShowForm(false); await load() }}
        />
      )}

      {registering && (
        <ProcedureForm
          editing={null}
          prefill={{
            date: registering.date > today ? today : registering.date,
            clientName: registering.client_name,
            clientPhone: registering.client_phone ?? undefined,
            procedureType: registering.procedure_type ?? undefined,
          }}
          procedures={byType('procedure').map(o => o.value)}
          payments={byType('payment_method').map(o => o.value)}
          sources={byType('client_source').map(o => o.value)}
          currency={currency}
          onClose={() => setRegistering(null)}
          onSaved={(procedureId) => markDone(registering, procedureId)}
        />
      )}
    </div>
  )
}

function Group({ title, appts, showDate, muted, tone, onTap }: {
  title: string
  appts: Appointment[]
  showDate?: boolean
  muted?: boolean
  tone?: 'warn'
  currency: string
  onTap: (a: Appointment) => void
}) {
  if (appts.length === 0) return null
  return (
    <section>
      <h2 className={`text-xs uppercase tracking-wider mb-2 flex items-center gap-2 ${tone === 'warn' ? 'text-amber-300' : 'text-muted'}`}>
        {title}
        <span className="text-[10px] font-normal normal-case text-muted">· {appts.length}</span>
      </h2>
      <ul className="space-y-2">
        {appts.map(a => {
          const time = formatTime(a.time)
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onTap(a)}
                className={`w-full neta-card !p-4 flex items-center gap-3 text-left transition hover:border-accent/40 ${muted ? 'opacity-70' : ''} ${tone === 'warn' ? '!border-amber-400/30' : ''}`}
              >
                <div className="shrink-0 w-16 text-center">
                  {time ? (
                    <div className="text-sm font-semibold leading-tight">{time.replace(' ', ' ')}</div>
                  ) : (
                    <Clock size={18} className="text-muted mx-auto" />
                  )}
                  {showDate && <div className="text-[11px] text-muted mt-0.5">{shortDM(a.date)}</div>}
                </div>
                <div className="flex-1 min-w-0 border-l border-border pl-3">
                  <div className="font-medium truncate">{a.client_name}</div>
                  <div className="text-sm text-muted truncate">
                    {a.procedure_type
                      ? <span className="text-accent font-medium">{a.procedure_type}</span>
                      : <span>Sin especificar</span>}
                    {a.status === 'done' && <span className="text-positive"> · Atendida</span>}
                    {a.status === 'canceled' && <span> · Cancelada</span>}
                    {a.status === 'no_show' && <span className="text-amber-300"> · No vino</span>}
                    {showDate && a.status === 'scheduled' && <span> · {relativeDate(a.date)}</span>}
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function AppointmentDetail({ appt: a, waUrl, onClose, onRegister, onEdit, onCancel, onNoShow, onDelete }: {
  appt: Appointment
  waUrl: string | null
  onClose: () => void
  onRegister: () => void
  onEdit: () => void
  onCancel: () => void
  onNoShow: () => void
  onDelete: () => void
}) {
  const time = formatTime(a.time)
  const scheduled = a.status === 'scheduled'
  return (
    <Modal open title="Detalle de la cita" onClose={onClose}>
      <div className="space-y-5">
        <div className="text-center pb-1">
          <div className="text-2xl font-semibold">{a.client_name}</div>
          {a.procedure_type && <div className="text-sm text-accent font-medium mt-1">{a.procedure_type}</div>}
          {a.status === 'done' && <div className="text-xs text-positive mt-1">Atendida</div>}
          {a.status === 'canceled' && <div className="text-xs text-muted mt-1">Cancelada</div>}
          {a.status === 'no_show' && <div className="text-xs text-amber-300 mt-1">No vino</div>}
        </div>

        <div className="space-y-3 border-t border-border pt-5">
          <Row icon={<CalendarDays size={15} />} label="Fecha" value={`${shortDate(a.date)} · ${relativeDate(a.date)}`} />
          {time && <Row icon={<Clock size={15} />} label="Hora" value={time} />}
          {a.client_phone && (
            <Row icon={<Phone size={15} />} label="Celular" value={<a href={`tel:${a.client_phone}`} className="text-accent hover:underline">{a.client_phone}</a>} />
          )}
          <Row icon={<FileText size={15} />} label="Notas" value={a.notes?.trim() ? a.notes : <span className="text-muted">Sin notas</span>} />
        </div>

        {scheduled && (
          <div className="space-y-2 border-t border-border pt-5">
            {waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition hover:opacity-90 active:opacity-80"
                style={{ backgroundColor: '#25D366', color: '#0B141A' }}
              >
                <MessageCircle size={16} /> Recordar por WhatsApp
              </a>
            ) : (
              <p className="text-xs text-muted text-center px-2">Agrega el celular del cliente para poder recordarle por WhatsApp.</p>
            )}
            <button onClick={onRegister} className="neta-btn-primary w-full flex items-center justify-center gap-2">
              <ClipboardCheck size={16} /> Registrar atención
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={onEdit} className="neta-btn-ghost flex items-center justify-center gap-1.5 text-sm py-2.5">
                <Edit2 size={14} /> Editar
              </button>
              <button onClick={onNoShow} className="neta-btn-ghost flex items-center justify-center gap-1.5 text-sm py-2.5">
                <UserX size={14} /> No vino
              </button>
              <button onClick={onCancel} className="neta-btn-ghost flex items-center justify-center gap-1.5 text-sm py-2.5">
                <Ban size={14} /> Cancelar
              </button>
              <button onClick={onDelete} className="neta-btn-ghost flex items-center justify-center gap-1.5 text-sm py-2.5 hover:!text-negative">
                <Trash2 size={14} /> Borrar
              </button>
            </div>
          </div>
        )}
        {!scheduled && (
          <div className="border-t border-border pt-5">
            <button onClick={onDelete} className="neta-btn-ghost w-full flex items-center justify-center gap-2 text-sm hover:!text-negative">
              <Trash2 size={15} /> Borrar del historial
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
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

function AppointmentForm({ editing, procedures, onClose, onSaved }: {
  editing: Appointment | null
  procedures: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const toast = useToast()

  const [date, setDate] = useState(editing?.date ?? todayISO())
  const [time, setTime] = useState(editing?.time ? editing.time.slice(0, 5) : '')
  const [clientName, setClientName] = useState(editing?.client_name ?? '')
  const [clientPhone, setClientPhone] = useState(editing?.client_phone ?? '')
  const [procType, setProcType] = useState(editing?.procedure_type ?? '')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [busy, setBusy] = useState(false)
  const [clients, setClients] = useState<ClientStats[]>([])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase.from('procedures').select('*').eq('user_id', user.id)
      if (cancelled) return
      setClients(aggregateClients((data ?? []) as Procedure[]))
    })()
    return () => { cancelled = true }
  }, [user])

  const matchedClient = useMemo(() => {
    const key = clientKey(clientName)
    return key ? clients.find(c => c.key === key) : undefined
  }, [clientName, clients])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!clientName.trim()) { toast.show('Escribe el nombre del cliente', 'error'); return }
    setBusy(true)
    const payload = {
      user_id: user.id,
      date,
      time: time || null,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim() || null,
      procedure_type: procType || null,
      notes: notes.trim() || null,
    }
    const { error } = editing
      ? await supabase.from('appointments').update(payload).eq('id', editing.id)
      : await supabase.from('appointments').insert(payload)
    setBusy(false)
    if (error) toast.show(translateError(error), 'error')
    else { toast.show(editing ? 'Cita actualizada' : 'Cita agendada', 'success'); onSaved() }
  }

  return (
    <Modal open title={editing ? 'Editar cita' : 'Agendar cita'} onClose={onClose}
      footer={<>
        <button type="button" onClick={onClose} className="neta-btn-ghost">Cancelar</button>
        <button type="submit" form="appt-form" disabled={busy} className="neta-btn-primary flex items-center gap-2">
          {busy && <Loader2 size={16} className="animate-spin" />} Guardar
        </button>
      </>}>
      <form id="appt-form" onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="neta-label">Fecha</label>
            <input type="date" lang="es" required value={date} onChange={e => setDate(e.target.value)} className="neta-input" />
          </div>
          <div>
            <label className="neta-label">Hora (opcional)</label>
            <input type="time" lang="es" value={time} onChange={e => setTime(e.target.value)} className="neta-input" />
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
            <label className="neta-label">Procedimiento (opcional)</label>
            <Select
              value={procType}
              onChange={setProcType}
              options={[{ value: '', label: 'Sin especificar' }, ...procedures.map(p => ({ value: p, label: p }))]}
              placeholder="Sin especificar"
            />
          </div>
        </div>
        <div>
          <label className="neta-label">Notas (opcional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} autoComplete="off" className="neta-input min-h-[80px] resize-none" placeholder="Ej. retoque, primera sesión, alergias…" />
        </div>
      </form>
    </Modal>
  )
}
