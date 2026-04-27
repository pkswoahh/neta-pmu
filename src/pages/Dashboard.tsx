import { useEffect, useMemo, useState } from 'react'
import { Loader2, TrendingUp, TrendingDown, ClipboardList, Target, Edit2, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/contexts/ProfileContext'
import MonthSelector from '@/components/MonthSelector'
import MoneyInput from '@/components/MoneyInput'
import { currentMonth, formatMoney, monthRange } from '@/lib/utils'
import type { Expense, Procedure } from '@/types/database'

export default function Dashboard() {
  const { user } = useAuth()
  const { profile, updateProfile } = useProfile()

  const [month, setMonth] = useState(currentMonth())
  const [procs, setProcs] = useState<Procedure[]>([])
  const [exps, setExps] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  // recurring/new client logic: a "new" client is one whose first procedure is in this month.
  const [historyNames, setHistoryNames] = useState<Map<string, string>>(new Map()) // name -> earliest date

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const { start, end } = monthRange(month)
      const [{ data: pData }, { data: eData }, { data: allProcs }] = await Promise.all([
        supabase.from('procedures').select('*').eq('user_id', user.id).gte('date', start).lt('date', end).order('date', { ascending: false }),
        supabase.from('expenses').select('*').eq('user_id', user.id).gte('date', start).lt('date', end),
        supabase.from('procedures').select('client_name,date').eq('user_id', user.id).lt('date', end),
      ])
      if (cancelled) return
      const map = new Map<string, string>()
      ;(allProcs ?? []).forEach((row: any) => {
        const key = (row.client_name ?? '').trim().toLowerCase()
        if (!key) return
        const prev = map.get(key)
        if (!prev || row.date < prev) map.set(key, row.date)
      })
      setHistoryNames(map)
      setProcs((pData ?? []) as Procedure[])
      setExps((eData ?? []) as Expense[])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [user, month])

  const currency = profile?.currency ?? 'COP'
  const goal = profile?.monthly_goal ?? 0

  const stats = useMemo(() => {
    const income = procs.reduce((s, p) => s + Number(p.amount), 0)
    const expenseTotal = exps.reduce((s, g) => s + Number(g.amount), 0)
    const profit = income - expenseTotal
    const { start } = monthRange(month)

    let newClients = 0
    let recurring = 0
    const seenThisMonth = new Set<string>()
    procs.forEach(p => {
      const key = (p.client_name ?? '').trim().toLowerCase()
      if (!key || seenThisMonth.has(key)) return
      seenThisMonth.add(key)
      const earliest = historyNames.get(key)
      if (earliest && earliest >= start) newClients += 1
      else recurring += 1
    })

    return { income, expenseTotal, profit, newClients, recurring }
  }, [procs, exps, historyNames, month])

  const goalPct = goal > 0 ? Math.min(999, Math.round((stats.income / goal) * 100)) : 0
  const goalReached = goal > 0 && stats.income >= goal
  const barWidth = goal > 0 ? Math.min(100, (stats.income / goal) * 100) : 0

  const sourceBreakdown = breakdownBy(procs, p => p.client_source)
  const procBreakdown = breakdownBy(procs, p => p.procedure_type)
  const paymentBreakdown = breakdownBy(procs, p => p.payment_method)
  const expenseBreakdown = breakdownBy(exps, g => g.category)

  const [editingGoal, setEditingGoal] = useState(false)
  const [draftGoal, setDraftGoal] = useState<number>(goal)

  useEffect(() => { setDraftGoal(goal) }, [goal])

  async function saveGoal() {
    await updateProfile({ monthly_goal: draftGoal })
    setEditingGoal(false)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="hidden md:flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {profile?.business_name ? `Hola, ${profile.business_name}` : 'Dashboard'}
          </h1>
          <p className="text-muted mt-2">Tu negocio, claro como el agua.</p>
        </div>
        <MonthSelector value={month} onChange={setMonth} />
      </div>
      <div className="md:hidden">
        <MonthSelector value={month} onChange={setMonth} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-muted"><Loader2 className="animate-spin" /></div>
      ) : (
        <>
          {/* Meta mensual */}
          <div className="neta-card relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3 relative">
              <div className="flex items-center gap-2 text-muted text-sm">
                <Target size={16} />
                Meta mensual
              </div>
              {!editingGoal ? (
                <button onClick={() => setEditingGoal(true)} className="text-muted hover:text-primary p-1 rounded-lg" aria-label="Editar meta">
                  <Edit2 size={14} />
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button onClick={saveGoal} className="text-positive p-1 hover:bg-positive/10 rounded-lg"><Check size={14} /></button>
                  <button onClick={() => { setEditingGoal(false); setDraftGoal(goal) }} className="text-muted p-1 hover:bg-surface rounded-lg"><X size={14} /></button>
                </div>
              )}
            </div>
            {editingGoal ? (
              <MoneyInput value={draftGoal} onChange={setDraftGoal} currency={currency} />
            ) : goal === 0 ? (
              <p className="text-muted text-sm py-3">Define tu meta tocando el lápiz.</p>
            ) : (
              <>
                <p className="text-lg md:text-xl">
                  Llevas <span className="font-semibold">{formatMoney(stats.income, currency)}</span> de <span className="text-muted">{formatMoney(goal, currency)}</span> — <span className={goalReached ? 'text-positive font-semibold' : 'text-accent font-semibold'}>{goalPct}%</span>
                </p>
                <div className="mt-4 h-2.5 bg-bg rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      background: goalReached ? '#6EE7B7' : '#E8A598',
                    }}
                  />
                </div>
                {goalReached && <p className="text-positive text-xs mt-2">¡Meta superada! Vas {goalPct - 100}% por encima.</p>}
              </>
            )}
          </div>

          {/* Cards resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <SummaryCard
              label="Ingresos"
              value={formatMoney(stats.income, currency)}
              icon={<TrendingUp size={16} className="text-positive" />}
            />
            <SummaryCard
              label="Gastos"
              value={formatMoney(stats.expenseTotal, currency)}
              icon={<TrendingDown size={16} className="text-negative" />}
            />
            <SummaryCard
              label="Ganancia neta"
              value={formatMoney(stats.profit, currency)}
              valueClass={stats.profit >= 0 ? 'text-positive' : 'text-negative'}
              icon={<span className={stats.profit >= 0 ? 'text-positive' : 'text-negative'}>=</span>}
            />
            <SummaryCard
              label="Procedimientos"
              value={String(procs.length)}
              icon={<ClipboardList size={16} className="text-accent" />}
              hint={`${stats.newClients} nuevos · ${stats.recurring} frecuentes`}
            />
          </div>

          <BreakdownCard title="Clientes por origen" items={sourceBreakdown} totalLabel="clientes" colorBar />
          <BreakdownCard title="Procedimientos por tipo" items={procBreakdown} totalLabel="servicios" />
          <BreakdownCard title="Ingresos por método de pago" items={paymentBreakdown} totalLabel="ingresos" valueAsMoney currency={currency} />
          <BreakdownCard title="Egresos por categoría" items={expenseBreakdown} totalLabel="egresos" valueAsMoney currency={currency} negative />
        </>
      )}
    </div>
  )
}

function SummaryCard({ label, value, icon, valueClass, hint }: { label: string; value: string; icon?: React.ReactNode; valueClass?: string; hint?: string }) {
  return (
    <div className="neta-card !p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted mb-2">
        {icon}
        {label}
      </div>
      <div className={`text-lg md:text-2xl font-semibold leading-tight ${valueClass ?? ''}`}>{value}</div>
      {hint && <div className="text-[11px] text-muted mt-1">{hint}</div>}
    </div>
  )
}

interface BreakdownItem {
  label: string
  count: number
  value: number
}

function breakdownBy<T extends { amount?: number }>(rows: T[], keyFn: (r: T) => string): BreakdownItem[] {
  const map = new Map<string, BreakdownItem>()
  rows.forEach(r => {
    const k = keyFn(r) || '—'
    const cur = map.get(k) ?? { label: k, count: 0, value: 0 }
    cur.count += 1
    cur.value += Number((r as any).amount ?? 0)
    map.set(k, cur)
  })
  return [...map.values()].sort((a, b) => b.value - a.value || b.count - a.count)
}

function BreakdownCard({
  title,
  items,
  totalLabel,
  valueAsMoney,
  currency,
  colorBar,
  negative,
}: {
  title: string
  items: BreakdownItem[]
  totalLabel: string
  valueAsMoney?: boolean
  currency?: string
  colorBar?: boolean
  negative?: boolean
}) {
  const total = items.reduce((s, i) => s + (valueAsMoney ? i.value : i.count), 0)
  return (
    <div className="neta-card">
      <h3 className="text-base font-semibold mb-4">{title}</h3>
      {items.length === 0 || total === 0 ? (
        <p className="text-sm text-muted py-2">Sin datos este mes.</p>
      ) : (
        <ul className="space-y-3">
          {items.map(item => {
            const portion = valueAsMoney ? item.value : item.count
            const pct = total > 0 ? Math.round((portion / total) * 100) : 0
            return (
              <li key={item.label}>
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  <span className="text-sm truncate flex-1">{item.label}</span>
                  <span className="text-sm font-medium tabular-nums">
                    {valueAsMoney
                      ? `${negative ? '-' : ''}${formatMoney(item.value, currency ?? 'COP')}`
                      : `${item.count}`}
                  </span>
                  <span className="text-xs text-muted w-10 text-right tabular-nums">{pct}%</span>
                </div>
                <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: colorBar ? '#D4A96A' : negative ? '#FDA4AF' : '#E8A598',
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
