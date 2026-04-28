import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileClock, Ban, RotateCcw, Gift, GiftIcon, Clock, Shield, Search, X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { ListSkeleton } from '@/components/Skeleton'
import Empty from '@/components/Empty'
import { clientKey, cn, relativeDate } from '@/lib/utils'
import type { AdminAuditEntry } from '@/types/database'

const ACTIONS: Record<string, { label: string; icon: React.ReactNode; tone: string }> = {
  suspend: { label: 'Suspendió', icon: <Ban size={14} />, tone: 'text-negative' },
  unsuspend: { label: 'Reactivó', icon: <RotateCcw size={14} />, tone: 'text-positive' },
  comp: { label: 'Otorgó cortesía', icon: <Gift size={14} />, tone: 'text-gold' },
  remove_comp: { label: 'Quitó cortesía', icon: <GiftIcon size={14} />, tone: 'text-muted' },
  extend_trial: { label: 'Extendió trial', icon: <Clock size={14} />, tone: 'text-accent' },
  set_role: { label: 'Cambió rol', icon: <Shield size={14} />, tone: 'text-gold' },
}

export default function Auditoria() {
  const toast = useToast()
  const [entries, setEntries] = useState<AdminAuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filterAction, setFilterAction] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase.rpc('admin_audit_log_recent', { limit_n: 200 })
      if (cancelled) return
      if (error) toast.show(error.message, 'error')
      else setEntries((data ?? []) as AdminAuditEntry[])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    let result = entries
    if (filterAction) result = result.filter(e => e.action === filterAction)
    if (query) {
      const q = clientKey(query)
      result = result.filter(e =>
        clientKey(e.target_name ?? '').includes(q) ||
        clientKey(e.admin_email ?? '').includes(q) ||
        clientKey(e.reason ?? '').includes(q),
      )
    }
    return result
  }, [entries, filterAction, query])

  const actionTypes = useMemo(() => {
    const set = new Set(entries.map(e => e.action))
    return Array.from(set)
  }, [entries])

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Auditoría</h1>
        <p className="text-muted mt-2">Registro de todas las acciones del admin sobre usuarias.</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        <button
          onClick={() => setFilterAction('')}
          className={cn(
            'shrink-0 text-sm px-3 py-1.5 rounded-lg transition border',
            !filterAction
              ? 'bg-surface border-accent/40 text-primary'
              : 'border-border text-muted hover:text-primary',
          )}
        >
          Todas las acciones
        </button>
        {actionTypes.map(a => {
          const meta = ACTIONS[a]
          return (
            <button
              key={a}
              onClick={() => setFilterAction(a)}
              className={cn(
                'shrink-0 text-sm px-3 py-1.5 rounded-lg transition border flex items-center gap-1.5',
                filterAction === a
                  ? 'bg-surface border-accent/40 text-primary'
                  : 'border-border text-muted hover:text-primary',
              )}
            >
              {meta?.icon}
              {meta?.label ?? a}
            </button>
          )
        })}
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por usuaria, admin o razón"
          className="neta-input pl-9 pr-9 py-2.5 text-sm"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
            <X size={14} />
          </button>
        )}
      </div>

      {(filterAction || query) && (
        <p className="text-xs text-muted">{filtered.length} de {entries.length} entradas</p>
      )}

      {loading ? (
        <ListSkeleton rows={8} />
      ) : entries.length === 0 ? (
        <div className="neta-card">
          <Empty
            icon={<FileClock size={32} />}
            title="Aún no hay acciones registradas"
            hint="Cada acción del admin (comp, suspender, extender trial, etc.) aparecerá aquí."
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="neta-card">
          <Empty title="Sin coincidencias" hint="Prueba con otra búsqueda o quita los filtros." />
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map(e => {
            const meta = ACTIONS[e.action] ?? { label: e.action, icon: <FileClock size={14} />, tone: 'text-muted' }
            return (
              <li key={e.id} className="neta-card !p-4">
                <div className="flex items-start gap-3">
                  <div className={cn('mt-0.5 shrink-0', meta.tone)}>{meta.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap text-sm">
                      <span className={cn('font-semibold', meta.tone)}>{meta.label}</span>
                      {e.target_user_id && e.target_name && (
                        <Link
                          to={`/admin/usuarias/${e.target_user_id}`}
                          className="text-primary hover:text-accent truncate"
                        >
                          {e.target_name}
                        </Link>
                      )}
                      <span className="text-xs text-muted">{relativeDate(e.created_at.slice(0, 10))}</span>
                    </div>
                    {e.reason && (
                      <div className="text-sm text-muted mt-1 italic">"{e.reason}"</div>
                    )}
                    <div className="text-[11px] text-muted mt-1.5 flex items-center gap-2 flex-wrap">
                      <span>por {e.admin_name ?? e.admin_email ?? 'admin'}</span>
                      {Object.keys(e.details ?? {}).length > 0 && (
                        <span className="bg-bg border border-border rounded px-1.5 py-0.5 font-mono text-[10px]">
                          {summarizeDetails(e.details)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function summarizeDetails(details: Record<string, unknown>): string {
  const parts: string[] = []
  if (details.days_added) parts.push(`+${details.days_added}d`)
  if (details.new_status) parts.push(`→ ${details.new_status}`)
  if (details.new_role) parts.push(`→ ${details.new_role}`)
  if (details.until) parts.push(`hasta ${String(details.until).slice(0, 10)}`)
  if (details.new_trial_ends_at) parts.push(`trial ${String(details.new_trial_ends_at).slice(0, 10)}`)
  return parts.join(' · ')
}
