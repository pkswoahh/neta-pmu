import { useEffect, useState } from 'react'
import { Phone, Calendar, TrendingUp, ClipboardList, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/contexts/ProfileContext'
import Modal from './Modal'
import { findClient, type ClientStats } from '@/lib/clients'
import { formatMoney, relativeDate, shortDate, clientKey } from '@/lib/utils'
import type { Procedure } from '@/types/database'

interface Props {
  clientName: string
  open: boolean
  onClose: () => void
}

export default function ClientHistoryModal({ clientName, open, onClose }: Props) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open || !user) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const key = clientKey(clientName)
      const { data } = await supabase
        .from('procedures')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      if (cancelled) return
      const rows = ((data ?? []) as Procedure[]).filter(p => clientKey(p.client_name) === key)
      setStats(findClient(rows, clientName))
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [open, user, clientName])

  const currency = profile?.currency ?? 'COP'

  return (
    <Modal open={open} title={stats?.displayName ?? clientName} onClose={onClose}>
      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted">
          <Loader2 className="animate-spin" />
        </div>
      ) : !stats ? (
        <p className="text-sm text-muted py-6 text-center">No hay historial para este cliente.</p>
      ) : (
        <div className="space-y-5">
          {stats.phone && (
            <a
              href={`tel:${stats.phone}`}
              className="flex items-center gap-2 text-sm text-accent hover:underline"
            >
              <Phone size={14} />
              {stats.phone}
            </a>
          )}

          <div className="grid grid-cols-3 gap-2">
            <StatBox
              label="Total"
              value={formatMoney(stats.total, currency)}
              icon={<TrendingUp size={14} className="text-positive" />}
            />
            <StatBox
              label="Visitas"
              value={String(stats.visits)}
              icon={<Calendar size={14} className="text-accent" />}
            />
            <StatBox
              label="Promedio"
              value={formatMoney(stats.total / stats.visits, currency)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Primera visita" value={shortDate(stats.firstVisit)} />
            <Detail label="Última visita" value={relativeDate(stats.lastVisit)} />
            {stats.topProcedure && (
              <Detail
                label="Servicio favorito"
                value={`${stats.topProcedure.name} (${stats.topProcedure.count})`}
                wide
              />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted mb-3">
              <ClipboardList size={12} />
              Historial
            </div>
            <ul className="space-y-2">
              {stats.procedures.map(p => (
                <li key={p.id} className="bg-bg border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-medium truncate">{p.procedure_type}</span>
                      <span className="text-xs text-muted">{relativeDate(p.date)}</span>
                    </div>
                    <div className="text-xs text-muted truncate">
                      {p.payment_method} · {p.client_source}
                    </div>
                  </div>
                  <div className="font-semibold tabular-nums shrink-0">
                    {formatMoney(Number(p.amount), currency)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  )
}

function StatBox({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-bg border border-border rounded-xl px-3 py-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted mb-1">
        {icon}
        {label}
      </div>
      <div className="text-base font-semibold leading-tight tabular-nums truncate">{value}</div>
    </div>
  )
}

function Detail({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <div className="text-xs text-muted">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}
