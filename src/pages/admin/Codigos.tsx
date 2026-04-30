import { useEffect, useState } from 'react'
import { Plus, Power, Trash2, Copy, Check, Ticket } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { useConfirm } from '@/components/Confirm'
import Modal from '@/components/Modal'
import Empty from '@/components/Empty'
import { ListSkeleton } from '@/components/Skeleton'
import { cn, shortDate } from '@/lib/utils'
import type { InvitationCode } from '@/types/database'

export default function Codigos() {
  const toast = useToast()
  const confirm = useConfirm()
  const [items, setItems] = useState<InvitationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.rpc('admin_list_invitation_codes')
    if (error) {
      toast.show(error.message, 'error')
    } else {
      setItems((data ?? []) as InvitationCode[])
    }
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  async function toggleActive(c: InvitationCode) {
    const { error } = await supabase.rpc('admin_toggle_invitation_code', {
      p_id: c.id,
      p_active: !c.active,
    })
    if (error) toast.show(error.message, 'error')
    else {
      toast.show(c.active ? 'Código desactivado' : 'Código activado', 'success')
      void load()
    }
  }

  async function remove(c: InvitationCode) {
    const ok = await confirm({
      title: '¿Eliminar este código?',
      message: `Se eliminará "${c.code}". Las cuentas que ya lo hayan usado siguen activas.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!ok) return
    const { error } = await supabase.rpc('admin_delete_invitation_code', { p_id: c.id })
    if (error) toast.show(error.message, 'error')
    else {
      toast.show('Código eliminado', 'success')
      void load()
    }
  }

  async function copyCode(code: string, id: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      setTimeout(() => setCopiedId(prev => (prev === id ? null : prev)), 1500)
    } catch {
      toast.show('No se pudo copiar', 'error')
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Códigos de invitación</h1>
          <p className="text-muted mt-2">Acceso para la beta cerrada. Cada código tiene un cupo de usos.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="neta-btn-primary px-3 py-2.5 flex items-center gap-1.5 text-sm"
        >
          <Plus size={15} /> Nuevo código
        </button>
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : items.length === 0 ? (
        <div className="neta-card">
          <Empty
            icon={<Ticket size={32} />}
            title="No hay códigos aún"
            hint="Crea un código y compártelo por WhatsApp con las usuarias seleccionadas."
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map(c => {
            const exhausted = c.used_count >= c.max_uses
            const expired = c.expires_at ? new Date(c.expires_at) < new Date() : false
            const inactive = !c.active || exhausted || expired
            return (
              <li key={c.id} className="neta-card !p-4 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <code className="font-mono text-base font-semibold tracking-wider">{c.code}</code>
                    <span
                      className={cn(
                        'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border',
                        inactive
                          ? 'border-muted/40 text-muted'
                          : 'border-positive/40 text-positive bg-positive/5',
                      )}
                    >
                      {!c.active ? 'Pausado' : exhausted ? 'Agotado' : expired ? 'Vencido' : 'Activo'}
                    </span>
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {c.used_count} / {c.max_uses} usos · creado {shortDate(c.created_at.slice(0, 10))}
                    {c.expires_at && ` · vence ${shortDate(c.expires_at.slice(0, 10))}`}
                    {c.notes && ` · ${c.notes}`}
                  </div>
                  <div className="mt-2 h-1.5 bg-bg rounded-full overflow-hidden max-w-xs">
                    <div
                      className="h-full bg-accent transition-all duration-500"
                      style={{ width: `${Math.min(100, (c.used_count / c.max_uses) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copyCode(c.code, c.id)}
                    className="text-muted hover:text-primary p-2 rounded-lg hover:bg-surface transition"
                    title="Copiar"
                  >
                    {copiedId === c.id ? <Check size={15} className="text-positive" /> : <Copy size={15} />}
                  </button>
                  <button
                    onClick={() => toggleActive(c)}
                    className="text-muted hover:text-primary p-2 rounded-lg hover:bg-surface transition"
                    title={c.active ? 'Pausar' : 'Activar'}
                  >
                    <Power size={15} className={c.active ? 'text-positive' : ''} />
                  </button>
                  <button
                    onClick={() => remove(c)}
                    className="text-muted hover:text-negative p-2 rounded-lg hover:bg-negative/10 transition"
                    title="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {creating && <CreateModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); void load() }} />}
    </div>
  )
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const toast = useToast()
  const [code, setCode] = useState('')
  const [maxUses, setMaxUses] = useState(20)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setBusy(true)
    const { error } = await supabase.rpc('admin_create_invitation_code', {
      p_code: code.trim().toUpperCase(),
      p_max_uses: maxUses,
      p_expires_at: null,
      p_notes: notes.trim() || null,
    })
    setBusy(false)
    if (error) {
      toast.show(error.message, 'error')
    } else {
      toast.show('Código creado', 'success')
      onCreated()
    }
  }

  return (
    <Modal
      open
      title="Nuevo código de invitación"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="neta-btn-ghost">Cancelar</button>
          <button type="submit" form="new-code-form" disabled={busy} className="neta-btn-primary">
            Crear código
          </button>
        </>
      }
    >
      <form id="new-code-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="neta-label">Código</label>
          <input
            required
            autoFocus
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Ej. NETABETA"
            className="neta-input tracking-wider uppercase"
          />
          <p className="text-xs text-muted mt-1.5">Mayúsculas. Sin espacios. Lo verán las usuarias en el signup.</p>
        </div>
        <div>
          <label className="neta-label">Cupos disponibles</label>
          <input
            type="number"
            min={1}
            value={maxUses}
            onChange={e => setMaxUses(Math.max(1, Number(e.target.value) || 1))}
            className="neta-input"
          />
          <p className="text-xs text-muted mt-1.5">Cuántas cuentas pueden activarse con este código.</p>
        </div>
        <div>
          <label className="neta-label">Nota interna (opcional)</label>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ej. Beta cerrada — abril 2026"
            className="neta-input"
          />
        </div>
      </form>
    </Modal>
  )
}
