import { useEffect, useMemo, useState } from 'react'
import { TrendingUp, Users, Clock, Gift, Ban, AlertTriangle, UserPlus, Activity, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { DashboardSkeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import { formatMoney } from '@/lib/utils'
import { PRICE_MONTHLY_USD } from '@/lib/constants'
import type { AdminOverview } from '@/types/database'

interface DailySignup { day: string; count: number }

export default function AdminOverviewPage() {
  const toast = useToast()
  const [data, setData] = useState<AdminOverview | null>(null)
  const [signups, setSignups] = useState<DailySignup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const [overviewRes, dailyRes] = await Promise.all([
        supabase.rpc('admin_overview'),
        supabase.rpc('admin_signups_daily'),
      ])
      if (cancelled) return
      if (overviewRes.error) toast.show(overviewRes.error.message, 'error')
      else setData(overviewRes.data as AdminOverview)
      if (!dailyRes.error && dailyRes.data) setSignups(dailyRes.data as DailySignup[])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  const mrr = useMemo(() => (data?.paying ?? 0) * PRICE_MONTHLY_USD, [data])
  const trialConversion = useMemo(() => {
    if (!data) return 0
    const total = data.paying + data.expired
    if (total === 0) return 0
    return Math.round((data.paying / total) * 100)
  }, [data])

  if (loading || !data) return <DashboardSkeleton />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted mt-2">La salud de Neta. en una pantalla.</p>
      </div>

      {/* Métricas top */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Stat
          label="MRR estimado"
          value={formatMoney(mrr, 'USD')}
          hint={`${data.paying} suscripción${data.paying === 1 ? '' : 'es'} pagando`}
          icon={<TrendingUp size={16} className="text-positive" />}
        />
        <Stat
          label="Total usuarias"
          value={String(data.total_users)}
          hint={`+${data.signups_30d} últimos 30 días`}
          icon={<Users size={16} className="text-accent" />}
        />
        <Stat
          label="Activas 30d"
          value={String(data.active_30d)}
          hint={data.total_users > 0 ? `${Math.round((data.active_30d / data.total_users) * 100)}% del total` : undefined}
          icon={<Activity size={16} className="text-accent" />}
        />
        <Stat
          label="Conversión trial→pago"
          value={`${trialConversion}%`}
          hint="Trials vencidos que pagaron"
          icon={<Sparkles size={16} className="text-gold" />}
        />
      </div>

      {/* Gráfico signups */}
      <div className="neta-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <UserPlus size={16} className="text-accent" />
            Nuevas usuarias últimos 30 días
          </h2>
          <span className="text-sm text-muted">{data.signups_7d} esta semana</span>
        </div>
        <SignupsChart data={signups} />
      </div>

      {/* Distribución de estados */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Stat label="Trials" value={String(data.trials)} icon={<Clock size={14} className="text-accent" />} />
        <Stat label="Comp" value={String(data.comped)} icon={<Gift size={14} className="text-gold" />} />
        <Stat label="Vencidas" value={String(data.expired)} icon={<AlertTriangle size={14} className="text-negative" />} />
        <Stat label="Suspendidas" value={String(data.suspended)} icon={<Ban size={14} className="text-negative" />} />
      </div>

      {/* Cola de atención */}
      <div className="neta-card space-y-4">
        <h2 className="text-base font-semibold">Cola de atención</h2>
        <Queue
          icon={<Clock size={14} className="text-accent" />}
          label="Trials que vencen en ≤2 días"
          count={data.trial_ending_soon}
          tone="warning"
        />
        <Queue
          icon={<AlertTriangle size={14} className="text-negative" />}
          label="Cuentas vencidas (sin acceso)"
          count={data.expired}
          tone="danger"
        />
        <Queue
          icon={<Activity size={14} className="text-muted" />}
          label="Inactivas hace 30+ días (con acceso aún)"
          count={data.inactive_30d}
          tone="muted"
        />
      </div>
    </div>
  )
}

function Stat({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="neta-card !p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted mb-2">
        {icon}{label}
      </div>
      <div className="text-lg md:text-2xl font-semibold leading-tight tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-muted mt-1">{hint}</div>}
    </div>
  )
}

function Queue({ icon, label, count, tone }: { icon: React.ReactNode; label: string; count: number; tone: 'warning' | 'danger' | 'muted' }) {
  const toneClasses = {
    warning: 'text-accent',
    danger: 'text-negative',
    muted: 'text-muted',
  }[tone]
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2">{icon}{label}</span>
      <span className={`font-semibold tabular-nums ${toneClasses}`}>{count}</span>
    </div>
  )
}

function SignupsChart({ data }: { data: DailySignup[] }) {
  if (!data.length) return <p className="text-sm text-muted">Sin datos.</p>
  const max = Math.max(1, ...data.map(d => d.count))
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map(d => {
        const height = (d.count / max) * 100
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center justify-end" title={`${d.day}: ${d.count}`}>
            <div
              className="w-full bg-accent/40 hover:bg-accent rounded-t transition-colors"
              style={{ height: `${Math.max(2, height)}%` }}
            />
          </div>
        )
      })}
    </div>
  )
}
