import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Download, Users, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { ListSkeleton } from '@/components/Skeleton'
import Empty from '@/components/Empty'
import { clientKey, downloadCSV, relativeDate, shortDate, cn } from '@/lib/utils'
import { computeAccess, stateLabel, stateBadgeClasses, type AccessState } from '@/lib/access'
import { COUNTRY_NAMES } from '@/lib/constants'
import type { AdminUserRow, Profile } from '@/types/database'

type FilterTab = 'all' | 'trial' | 'paying' | 'expired' | 'canceled' | 'comped' | 'suspended' | 'inactive'

const tabs: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'trial', label: 'Trial' },
  { id: 'paying', label: 'Activas' },
  { id: 'expired', label: 'Vencidas' },
  { id: 'canceled', label: 'Canceladas' },
  { id: 'comped', label: 'Cortesía' },
  { id: 'suspended', label: 'Suspendidas' },
  { id: 'inactive', label: 'Inactivas 30d+' },
]

interface Row {
  data: AdminUserRow
  state: AccessState
}

export default function AdminUsuarias() {
  const toast = useToast()
  const nav = useNavigate()
  const [items, setItems] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FilterTab>('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase.rpc('admin_list_users')
      if (cancelled) return
      if (error) {
        toast.show(error.message, 'error')
        setLoading(false)
        return
      }
      const rows = ((data ?? []) as AdminUserRow[]).map((r): Row => ({
        data: r,
        state: computeAccess(r as unknown as Profile).state,
      }))
      setItems(rows)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    let result = items
    if (tab !== 'all') {
      result = result.filter(r => {
        if (tab === 'paying') return r.state === 'active' || r.state === 'past_due'
        if (tab === 'inactive') {
          if (!r.data.last_seen_at) return true
          const days = (Date.now() - +new Date(r.data.last_seen_at)) / 86400000
          return days >= 30 && r.state !== 'expired' && r.state !== 'suspended'
        }
        return r.state === tab
      })
    }
    if (query) {
      const q = clientKey(query)
      result = result.filter(r =>
        clientKey(r.data.business_name ?? '').includes(q) ||
        clientKey(r.data.email ?? '').includes(q),
      )
    }
    return result
  }, [items, tab, query])

  function handleExport() {
    if (!filtered.length) { toast.show('No hay datos para exportar', 'info'); return }
    downloadCSV(
      filtered.map(r => ({
        Negocio: r.data.business_name ?? '',
        Email: r.data.email ?? '',
        País: r.data.country ? COUNTRY_NAMES[r.data.country] ?? r.data.country : '',
        Moneda: r.data.currency,
        Estado: stateLabel(r.state),
        Rol: r.data.role,
        'Fecha registro': shortDate(r.data.created_at.slice(0, 10)),
        'Última actividad': r.data.last_seen_at ? shortDate(r.data.last_seen_at.slice(0, 10)) : '',
        'Trial vence': r.data.trial_ends_at ? shortDate(r.data.trial_ends_at.slice(0, 10)) : '',
        'Comp hasta': r.data.comped_until ? shortDate(r.data.comped_until.slice(0, 10)) : '',
      })),
      `neta-usuarias-${new Date().toISOString().slice(0, 10)}.csv`,
    )
    toast.show('Descargando CSV', 'success')
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Usuarias</h1>
          <p className="text-muted mt-2">{items.length} cuenta{items.length === 1 ? '' : 's'} registrada{items.length === 1 ? '' : 's'}.</p>
        </div>
        <button onClick={handleExport} className="neta-btn-ghost px-3 py-2.5 flex items-center gap-1.5 text-sm">
          <Download size={15} /> CSV
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'shrink-0 text-sm px-3 py-1.5 rounded-lg transition border',
              tab === t.id
                ? 'bg-surface border-accent/40 text-primary'
                : 'border-border text-muted hover:text-primary',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre o email"
          className="neta-input pl-9 pr-9 py-2.5 text-sm"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
            <X size={14} />
          </button>
        )}
      </div>

      {tab !== 'all' || query ? (
        <p className="text-xs text-muted">{filtered.length} de {items.length} resultados</p>
      ) : null}

      {loading ? (
        <ListSkeleton rows={6} />
      ) : items.length === 0 ? (
        <div className="neta-card">
          <Empty icon={<Users size={32} />} title="No hay usuarias registradas todavía." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="neta-card">
          <Empty title="Sin coincidencias" hint="Prueba con otra búsqueda o cambia de tab." />
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map(r => (
            <li key={r.data.id}>
              <button
                type="button"
                onClick={() => nav(`/admin/usuarias/${r.data.id}`)}
                className="w-full neta-card !p-4 flex items-center gap-3 text-left hover:border-accent/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-semibold shrink-0 text-sm">
                  {initials(r.data.business_name ?? r.data.email ?? '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-medium truncate">
                      {r.data.business_name ?? <span className="italic text-muted">Sin negocio</span>}
                    </span>
                    <span className={cn('text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border', stateBadgeClasses(r.state))}>
                      {stateLabel(r.state)}
                    </span>
                  </div>
                  <div className="text-xs text-muted truncate">
                    {r.data.email}
                    {r.data.country && ` · ${COUNTRY_NAMES[r.data.country] ?? r.data.country}`}
                    {r.data.last_seen_at && ` · activa ${relativeDate(r.data.last_seen_at.slice(0, 10))}`}
                  </div>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <div className="text-xs text-muted">Registrada</div>
                  <div className="text-sm">{shortDate(r.data.created_at.slice(0, 10))}</div>
                </div>
                <ChevronRight size={16} className="text-muted shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (!parts[0]) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
