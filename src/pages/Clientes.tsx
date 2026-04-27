import { useEffect, useMemo, useState } from 'react'
import { Search, Users, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useToast } from '@/components/Toast'
import { ListSkeleton } from '@/components/Skeleton'
import Empty from '@/components/Empty'
import ClientHistoryModal from '@/components/ClientHistoryModal'
import { aggregateClients, type ClientStats } from '@/lib/clients'
import { clientKey, formatMoney, relativeDate } from '@/lib/utils'
import type { Procedure } from '@/types/database'

export default function Clientes() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const toast = useToast()

  const [items, setItems] = useState<ClientStats[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [historyClient, setHistoryClient] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      if (cancelled) return
      if (error) toast.show(error.message, 'error')
      else setItems(aggregateClients((data ?? []) as Procedure[]))
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [user])

  const filtered = useMemo(() => {
    const q = clientKey(query)
    if (!q) return items
    return items.filter(c => c.key.includes(q))
  }, [items, query])

  const currency = profile?.currency ?? 'COP'

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="hidden md:block">
        <h1 className="text-3xl font-semibold tracking-tight">Clientes</h1>
        <p className="text-muted mt-2">Tu cartera, ordenada por última visita.</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre"
          className="neta-input pl-10 pr-10"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-primary rounded-lg"
            aria-label="Limpiar"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {!loading && (
        <p className="text-xs text-muted">
          {items.length === 0
            ? null
            : filtered.length === items.length
              ? `${items.length} ${items.length === 1 ? 'cliente' : 'clientes'} en total`
              : `${filtered.length} de ${items.length}`}
        </p>
      )}

      {loading ? (
        <ListSkeleton rows={6} />
      ) : items.length === 0 ? (
        <div className="neta-card">
          <Empty
            icon={<Users size={32} />}
            title="Aún no tienes clientes registrados"
            hint="Cada procedimiento que registres se contabiliza aquí."
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="neta-card">
          <Empty title="Sin coincidencias" hint="Prueba con otro nombre." />
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map(c => (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => setHistoryClient(c.displayName)}
                className="w-full neta-card !p-4 flex items-center gap-3 text-left hover:border-accent/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-semibold shrink-0">
                  {initials(c.displayName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-medium truncate">{c.displayName}</span>
                    <span className="text-xs text-muted">{relativeDate(c.lastVisit)}</span>
                  </div>
                  <div className="text-sm text-muted truncate">
                    {c.visits} {c.visits === 1 ? 'visita' : 'visitas'}
                    {c.topProcedure && ` · ${c.topProcedure.name}`}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold tabular-nums">{formatMoney(c.total, currency)}</div>
                  <div className="text-[11px] text-muted">total</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {historyClient && (
        <ClientHistoryModal
          open
          clientName={historyClient}
          onClose={() => setHistoryClient(null)}
        />
      )}
    </div>
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
