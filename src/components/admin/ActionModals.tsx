import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import Modal from '@/components/Modal'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { todayISO } from '@/lib/utils'

interface BaseProps {
  open: boolean
  onClose: () => void
  onDone: () => void
  targetUserId: string
  targetName: string
}

// ----------------------------------------
// Suspender (razón obligatoria)
// ----------------------------------------
export function SuspendModal({ open, onClose, onDone, targetUserId, targetName }: BaseProps) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!reason.trim()) {
      toast.show('La razón es obligatoria', 'error')
      return
    }
    setBusy(true)
    const { error } = await supabase.rpc('admin_suspend_user', { target: targetUserId, reason_text: reason.trim() })
    setBusy(false)
    if (error) toast.show(error.message, 'error')
    else { toast.show('Cuenta suspendida', 'success'); onDone() }
  }

  return (
    <Modal
      open={open}
      title="Suspender cuenta"
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className="neta-btn-ghost">Cancelar</button>
        <button onClick={submit} disabled={busy || !reason.trim()} className="bg-negative/20 border border-negative/40 text-negative font-semibold rounded-xl px-5 py-3 hover:bg-negative/30 transition disabled:opacity-50 flex items-center gap-2">
          {busy && <Loader2 size={16} className="animate-spin" />}
          Suspender
        </button>
      </>}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Vas a suspender a <span className="text-primary font-medium">{targetName}</span>. No podrá entrar a la app hasta que la reactives.
        </p>
        <div>
          <label className="neta-label">Razón <span className="text-negative">*</span></label>
          <textarea
            autoFocus
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ej. Pago disputado, comportamiento abusivo, prueba interna…"
            className="neta-input min-h-[100px] resize-none"
          />
          <p className="text-xs text-muted mt-1">La razón queda registrada en el audit log y la usuaria la verá al intentar entrar.</p>
        </div>
      </div>
    </Modal>
  )
}

// ----------------------------------------
// Reactivar (razón opcional)
// ----------------------------------------
export function UnsuspendModal({ open, onClose, onDone, targetUserId, targetName }: BaseProps) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    const { error, data } = await supabase.rpc('admin_unsuspend_user', { target: targetUserId, reason_text: reason.trim() || null })
    setBusy(false)
    if (error) toast.show(error.message, 'error')
    else { toast.show(`Reactivada como ${data}`, 'success'); onDone() }
  }

  return (
    <Modal
      open={open}
      title="Reactivar cuenta"
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className="neta-btn-ghost">Cancelar</button>
        <button onClick={submit} disabled={busy} className="neta-btn-primary flex items-center gap-2">
          {busy && <Loader2 size={16} className="animate-spin" />}
          Reactivar
        </button>
      </>}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Vas a reactivar a <span className="text-primary font-medium">{targetName}</span>. Su estado volverá según las fechas (trial vigente, suscripción activa o vencida).
        </p>
        <div>
          <label className="neta-label">Razón (opcional)</label>
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ej. Aclaró el pago, error de proceso…"
            className="neta-input"
          />
        </div>
      </div>
    </Modal>
  )
}

// ----------------------------------------
// Otorgar cortesía (con expiración opcional)
// ----------------------------------------
export function CompModal({ open, onClose, onDone, targetUserId, targetName }: BaseProps) {
  const toast = useToast()
  const [hasExpiration, setHasExpiration] = useState(false)
  const [until, setUntil] = useState(addMonths(todayISO(), 1))
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    const untilTs = hasExpiration ? new Date(until + 'T23:59:59').toISOString() : null
    const { error } = await supabase.rpc('admin_comp_user', {
      target: targetUserId,
      until_date: untilTs,
      reason_text: reason.trim() || null,
    })
    setBusy(false)
    if (error) toast.show(error.message, 'error')
    else { toast.show('Cortesía otorgada', 'success'); onDone() }
  }

  return (
    <Modal
      open={open}
      title="Otorgar cortesía"
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className="neta-btn-ghost">Cancelar</button>
        <button onClick={submit} disabled={busy} className="neta-btn-primary flex items-center gap-2">
          {busy && <Loader2 size={16} className="animate-spin" />}
          Otorgar
        </button>
      </>}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Le das acceso gratis a <span className="text-primary font-medium">{targetName}</span>.
        </p>
        <div className="flex items-center gap-3">
          <input
            id="has-exp"
            type="checkbox"
            checked={hasExpiration}
            onChange={e => setHasExpiration(e.target.checked)}
            className="w-4 h-4 accent-accent"
          />
          <label htmlFor="has-exp" className="text-sm">Con fecha de vencimiento</label>
        </div>
        {hasExpiration && (
          <div>
            <label className="neta-label">Vence el</label>
            <input
              type="date"
              value={until}
              onChange={e => setUntil(e.target.value)}
              min={todayISO()}
              className="neta-input"
            />
          </div>
        )}
        <div>
          <label className="neta-label">Razón (opcional)</label>
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ej. Promoción de lanzamiento, amiga del negocio…"
            className="neta-input"
          />
        </div>
      </div>
    </Modal>
  )
}

// ----------------------------------------
// Quitar cortesía
// ----------------------------------------
export function RemoveCompModal({ open, onClose, onDone, targetUserId, targetName }: BaseProps) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    const { error, data } = await supabase.rpc('admin_remove_comp', {
      target: targetUserId,
      reason_text: reason.trim() || null,
    })
    setBusy(false)
    if (error) toast.show(error.message, 'error')
    else { toast.show(`Cortesía retirada — quedó como ${data}`, 'success'); onDone() }
  }

  return (
    <Modal
      open={open}
      title="Quitar cortesía"
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className="neta-btn-ghost">Cancelar</button>
        <button onClick={submit} disabled={busy} className="neta-btn-primary flex items-center gap-2">
          {busy && <Loader2 size={16} className="animate-spin" />}
          Confirmar
        </button>
      </>}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Vas a quitar la cortesía a <span className="text-primary font-medium">{targetName}</span>. Volverá al estado que le corresponda según fechas (trial, activa o vencida).
        </p>
        <div>
          <label className="neta-label">Razón (opcional)</label>
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ej. Termina la promo…"
            className="neta-input"
          />
        </div>
      </div>
    </Modal>
  )
}

// ----------------------------------------
// Extender trial N días
// ----------------------------------------
export function ExtendTrialModal({ open, onClose, onDone, targetUserId, targetName }: BaseProps) {
  const toast = useToast()
  const [days, setDays] = useState(7)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (days <= 0) { toast.show('Días debe ser mayor a 0', 'error'); return }
    setBusy(true)
    const { error } = await supabase.rpc('admin_extend_trial', {
      target: targetUserId,
      days_to_add: days,
      reason_text: reason.trim() || null,
    })
    setBusy(false)
    if (error) toast.show(error.message, 'error')
    else { toast.show(`Trial extendido ${days} días`, 'success'); onDone() }
  }

  return (
    <Modal
      open={open}
      title="Extender trial"
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className="neta-btn-ghost">Cancelar</button>
        <button onClick={submit} disabled={busy || days <= 0} className="neta-btn-primary flex items-center gap-2">
          {busy && <Loader2 size={16} className="animate-spin" />}
          Extender
        </button>
      </>}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Le das más tiempo de trial a <span className="text-primary font-medium">{targetName}</span>.
          Si su trial ya venció, contará desde hoy.
        </p>
        <div>
          <label className="neta-label">Días a agregar</label>
          <input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={e => setDays(Number(e.target.value) || 0)}
            className="neta-input"
          />
          <div className="flex gap-2 mt-2">
            {[7, 14, 30].map(n => (
              <button key={n} type="button" onClick={() => setDays(n)} className="text-xs px-3 py-1 rounded-lg bg-bg border border-border hover:border-accent text-muted hover:text-primary">
                +{n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="neta-label">Razón (opcional)</label>
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ej. Necesita más tiempo para evaluar…"
            className="neta-input"
          />
        </div>
      </div>
    </Modal>
  )
}

// ----------------------------------------
// Helpers
// ----------------------------------------
function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1 + months, d)
  return date.toISOString().slice(0, 10)
}
