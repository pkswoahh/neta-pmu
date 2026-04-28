import { useEffect, useMemo, useState } from 'react'
import { Search, X, Download, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { ListSkeleton } from '@/components/Skeleton'
import Empty from '@/components/Empty'
import { clientKey, downloadCSV, relativeDate, shortDate, cn } from '@/lib/utils'
import { computeAccess, stateLabel, stateBadgeClasses, type AccessState } from '@/lib/access'
import { COUNTRY_NAMES } from '@/lib/constants'
import type { Profile } from '@/types/database'

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

interface UserRow {
  profile: Profile
  email: string | null
  state: AccessState
}

export default function AdminUsuarias() {
  const toast = useToast()
  const [items, setItems] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FilterTab>('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      // Traemos profiles + email del auth.users via función o join. Como auth.users
      // no es directamente seleccionable desde el cliente, usamos el campo de Supabase
      // que sí: en este caso, traemos solo profiles y email queda undefined hasta
      // que se pasa a Edge Function en sesión 2. Por ahora mostramos email vacío
      // y nos basamos en business_name + país.
      // Workaround: profiles no tiene email — para mostrarlo necesitaríamos un join.
      // Lo dejamos resolvable después con una vista o RPC dedicada.
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (error) {
        toast.show(error.message, 'error')
        setLoading(false)
        return
      }
      const rows = (data ?? []).map((p): UserRow => {
        const profile = p as Profile
        const access = computeAccess(profile)
        return { profile, email: null, state: access.state }
      })
      setItems(rows)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    let result = items
    // Tab filter
    if (tab !== 'all') {
      result = result.filter(r => {
        if (tab === 'paying') return r.state === 'active' || r.state === 'past_due'
        if (tab === 'inactive') {
          if (!r.profile.last_seen_at) return true
          const days = (Date.now() - +new Date(r.profile.last_seen_at)) / 86400000
          return days >= 30 && r.state !== 'expired' && r.state !== 'suspended'
        }
        return r.state === tab
      })
    }
    // Search
    if (query) {
      const q = clientKey(query)
      result = result.filter(r => clientKey(r.profile.business_name ?? '').includes(q))
    }
    return result
  }, [items, tab, query])

  function handleExport() {
    if (!filtered.length) { toast.show('No hay datos para exportar', 'info'); return }
    downloadCSV(
      filtered.map(r => ({
        Negocio: r.profile.business_name ?? '',
        País: r.profile.country ? COUNTRY_NAMES[r.profile.country] ?? r.profile.country : '',
        Moneda: r.profile.currency,
        Estado: stateLabel(r.state),
        Rol: r.profile.role,
        'Fecha registro': shortDate(r.profile.created_at.slice(0, 10)),
        'Última actividad': r.profile.last_seen_at ? shortDate(r.profile.last_seen_at.slice(0, 10)) : '',
        'Trial vence': r.profile.trial_ends_at ? shortDate(r.profile.trial_ends_at.slice(0, 10)) : '',
        'Comp hasta': r.profile.comped_until ? shortDate(r.profile.comped_until.slice(0, 10)) : '',
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

      {/* Tabs */}
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

      {/* Búsqueda */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre del negocio"
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
            <li key={r.profile.id} className="neta-card !p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-semibold shrink-0 text-sm">
                {initials(r.profile.business_name ?? '?')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium truncate">{r.profile.business_name ?? <span className="italic text-muted">Sin negocio</span>}</span>
                  <span className={cn('text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border', stateBadgeClasses(r.state))}>
                    {stateLabel(r.state)}
                  </span>
                </div>
                <div className="text-xs text-muted truncate">
                  {r.profile.country && (COUNTRY_NAMES[r.profile.country] ?? r.profile.country)}
                  {r.profile.country && ' · '}
                  {r.profile.currency}
                  {r.profile.last_seen_at && ` · activa ${relativeDate(r.profile.last_seen_at.slice(0, 10))}`}
                </div>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <div className="text-xs text-muted">Registrada</div>
                <div className="text-sm">{shortDate(r.profile.created_at.slice(0, 10))}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="bg-surface/40 border border-border rounded-xl px-4 py-3 text-xs text-muted">
        💡 El detalle de usuaria con acciones (comp, suspender, extender trial, etc.) llega en la próxima sesión del módulo admin.
      </div>
    </div>
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
