import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, ClipboardList, Target, Edit2, Check, X, Sparkles, ArrowRight, Settings, Wand2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useToast } from '@/components/Toast'
import PeriodSelector from '@/components/PeriodSelector'
import MoneyInput from '@/components/MoneyInput'
import { DashboardSkeleton } from '@/components/Skeleton'
import { seedDemoData } from '@/lib/demo'
import { translateError } from '@/lib/errors'
import { clientKey, currentMonth, defaultPeriod, formatMoney, periodRange, previousPeriodLabel, previousPeriodRange, type Period } from '@/lib/utils'
import type { Expense, Procedure } from '@/types/database'

export default function Dashboard() {
  const { user } = useAuth()
  const { profile, updateProfile } = useProfile()

  const [period, setPeriod] = useState<Period>(defaultPeriod())
  const [procs, setProcs] = useState<Procedure[]>([])
  const [exps, setExps] = useState<Expense[]>([])
  const [prevProcs, setPrevProcs] = useState<Procedure[]>([])
  const [prevExps, setPrevExps] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [historyNames, setHistoryNames] = useState<Map<string, string>>(new Map())
  const [totalProcCount, setTotalProcCount] = useState(0)
  const [totalExpenseCount, setTotalExpenseCount] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const { start, end } = periodRange(period)
      const { start: pStart, end: pEnd } = previousPeriodRange(period)

      const [{ data: pData }, { data: eData }, { data: ppData }, { data: peData }, { data: allProcs }, { count: procCount }, { count: expCount }] = await Promise.all([
        supabase.from('procedures').select('*').eq('user_id', user.id).gte('date', start).lt('date', end).order('date', { ascending: false }),
        supabase.from('expenses').select('*').eq('user_id', user.id).gte('date', start).lt('date', end),
        supabase.from('procedures').select('amount,date').eq('user_id', user.id).gte('date', pStart).lt('date', pEnd),
        supabase.from('expenses').select('amount').eq('user_id', user.id).gte('date', pStart).lt('date', pEnd),
        supabase.from('procedures').select('client_name,date').eq('user_id', user.id).lt('date', end),
        supabase.from('procedures').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ])
      if (cancelled) return
      const map = new Map<string, string>()
      ;(allProcs ?? []).forEach((row: any) => {
        const key = clientKey(row.client_name ?? '')
        if (!key) return
        const prev = map.get(key)
        if (!prev || row.date < prev) map.set(key, row.date)
      })
      setHistoryNames(map)
      setProcs((pData ?? []) as Procedure[])
      setExps((eData ?? []) as Expense[])
      setPrevProcs((ppData ?? []) as any[])
      setPrevExps((peData ?? []) as any[])
      setTotalProcCount(procCount ?? 0)
      setTotalExpenseCount(expCount ?? 0)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [user, period])

  const isEmptyAccount = totalProcCount === 0 && totalExpenseCount === 0

  const currency = profile?.currency ?? 'COP'
  const goal = profile?.monthly_goal ?? 0

  const stats = useMemo(() => {
    const income = procs.reduce((s, p) => s + Number(p.amount), 0)
    const expenseTotal = exps.reduce((s, g) => s + Number(g.amount), 0)
    const profit = income - expenseTotal
    const { start } = periodRange(period)
    const prevIncome = prevProcs.reduce((s, p) => s + Number(p.amount), 0)
    const prevExpenseTotal = prevExps.reduce((s, g) => s + Number(g.amount), 0)
    const prevProfit = prevIncome - prevExpenseTotal

    let newClients = 0
    let recurring = 0
    const seenThisMonth = new Set<string>()
    procs.forEach(p => {
      const key = clientKey(p.client_name)
      if (!key || seenThisMonth.has(key)) return
      seenThisMonth.add(key)
      const earliest = historyNames.get(key)
      if (earliest && earliest >= start) newClients += 1
      else recurring += 1
    })

    return {
      income, expenseTotal, profit, newClients, recurring,
      prevIncome, prevExpenseTotal, prevProfit, prevCount: prevProcs.length,
    }
  }, [procs, exps, prevProcs, prevExps, historyNames, period])

  const goalPct = goal > 0 ? Math.min(999, Math.round((stats.income / goal) * 100)) : 0
  const goalReached = goal > 0 && stats.income >= goal
  const barWidth = goal > 0 ? Math.min(100, (stats.income / goal) * 100) : 0

  // Un mes pasado ya está "cerrado": cambia el tono de la meta y oculta la
  // comparación cuando el periodo es un rango libre (no tiene "anterior" claro).
  const isPastMonth = period.kind === 'month' && period.month < currentMonth()
  const showComparison = period.kind !== 'range'

  const sourceBreakdown = breakdownBy(procs, p => p.client_source)
  const procBreakdown = breakdownBy(procs, p => p.procedure_type)
  const paymentBreakdown = breakdownBy(procs, p => p.payment_method)
  const expenseBreakdown = breakdownBy(exps, g => g.category)

  const [editingGoal, setEditingGoal] = useState(false)
  const [draftGoal, setDraftGoal] = useState<number>(goal)
  useEffect(() => { setDraftGoal(goal) }, [goal])
  async function saveGoal() { await updateProfile({ monthly_goal: draftGoal }); setEditingGoal(false) }

  const prevLabel = previousPeriodLabel(period)

  if (!loading && isEmptyAccount) {
    return (
      <WelcomeEmptyState
        businessName={profile?.business_name ?? null}
        userId={user?.id ?? null}
        currency={currency}
      />
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="hidden md:block">
        <h1 className="text-3xl font-semibold tracking-tight">
          {profile?.business_name ? `Hola, ${profile.business_name}` : 'Dashboard'}
        </h1>
        <p className="text-muted mt-2">Tu negocio, claro como el agua.</p>
      </div>
      <PeriodSelector value={period} onChange={setPeriod} />

      {loading ? <DashboardSkeleton /> : (
        <>
          {/* Meta mensual — solo tiene sentido en la vista de mes */}
          {period.kind === 'month' && (
          <div className="neta-card relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3 relative">
              <div className="flex items-center gap-2 text-muted text-sm"><Target size={16} /> Meta mensual</div>
              {!editingGoal
                ? <button onClick={() => setEditingGoal(true)} className="text-muted hover:text-primary p-1 rounded-lg"><Edit2 size={14} /></button>
                : <div className="flex items-center gap-1">
                    <button onClick={saveGoal} className="text-positive p-1 hover:bg-positive/10 rounded-lg"><Check size={14} /></button>
                    <button onClick={() => { setEditingGoal(false); setDraftGoal(goal) }} className="text-muted p-1 hover:bg-surface rounded-lg"><X size={14} /></button>
                  </div>}
            </div>
            {editingGoal ? (
              <MoneyInput value={draftGoal} onChange={setDraftGoal} currency={currency} />
            ) : goal === 0 ? (
              <p className="text-muted text-sm py-3">Define tu meta tocando el lápiz.</p>
            ) : (
              <>
                <p className="text-lg md:text-xl">
                  {isPastMonth ? 'Cerró en' : 'Llevas'} <span className="font-semibold">{formatMoney(stats.income, currency)}</span> de <span className="text-muted">{formatMoney(goal, currency)}</span> — <span className={goalReached ? 'text-positive font-semibold' : 'text-accent font-semibold'}>{goalPct}%</span>
                </p>
                <div className="mt-4 h-2.5 bg-bg rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-500" style={{ width: `${barWidth}%`, background: goalReached ? '#6EE7B7' : '#E8A598' }} />
                </div>
                {goalReached && <p className="text-positive text-xs mt-2">{isPastMonth ? `Superó la meta por ${goalPct - 100}%.` : `¡Meta superada! Vas ${goalPct - 100}% por encima.`}</p>}
              </>
            )}
          </div>
          )}

          {/* Cards resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <SummaryCard
              label="Ingresos"
              value={formatMoney(stats.income, currency)}
              icon={<TrendingUp size={16} className="text-positive" />}
              prev={showComparison ? stats.prevIncome : undefined}
              current={stats.income}
              prevLabel={prevLabel}
            />
            <SummaryCard
              label="Gastos"
              value={formatMoney(stats.expenseTotal, currency)}
              icon={<TrendingDown size={16} className="text-negative" />}
              prev={showComparison ? stats.prevExpenseTotal : undefined}
              current={stats.expenseTotal}
              prevLabel={prevLabel}
              invertDelta
            />
            <SummaryCard
              label="Ganancia neta"
              value={formatMoney(stats.profit, currency)}
              valueClass={stats.profit >= 0 ? 'text-positive' : 'text-negative'}
              prev={showComparison ? stats.prevProfit : undefined}
              current={stats.profit}
              prevLabel={prevLabel}
            />
            <SummaryCard
              label="Procedimientos"
              value={String(procs.length)}
              icon={<ClipboardList size={16} className="text-accent" />}
              hint={`${stats.newClients} nuevos · ${stats.recurring} frecuentes`}
              prev={showComparison ? stats.prevCount : undefined}
              current={procs.length}
              prevLabel={prevLabel}
              isCount
            />
          </div>

          <BreakdownCard title="Clientes por origen" items={sourceBreakdown} colorBar />
          <BreakdownCard title="Procedimientos por tipo" items={procBreakdown} topBadge="Más vendido" />
          <BreakdownCard title="Ingresos por método de pago" items={paymentBreakdown} valueAsMoney currency={currency} />
          <BreakdownCard title="Egresos por categoría" items={expenseBreakdown} valueAsMoney currency={currency} negative />
        </>
      )}
    </div>
  )
}

function WelcomeEmptyState({ businessName, userId, currency }: { businessName: string | null; userId: string | null; currency: string }) {
  const firstName = businessName?.split(' ')[0] ?? null
  const toast = useToast()
  const [seeding, setSeeding] = useState(false)

  async function exploreDemo() {
    if (!userId || seeding) return
    setSeeding(true)
    try {
      await seedDemoData(userId, currency)
      // Recarga limpia: el dashboard se repinta lleno y aparece el
      // banner de "modo demo" en toda la app.
      window.location.assign('/dashboard')
    } catch (e: any) {
      toast.show(translateError(e, 'No pudimos cargar los datos de ejemplo.'), 'error')
      setSeeding(false)
    }
  }

  return (
    <div className="animate-fade-in flex items-center justify-center min-h-[70vh] md:min-h-[80vh] px-2">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/15 text-accent mb-6">
          <Sparkles size={28} />
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          {firstName ? `¡Bienvenida, ${firstName}!` : '¡Bienvenida a Neta!'}
        </h1>
        <p className="text-muted mt-3 leading-relaxed">
          Tu dashboard cobra vida cuando registras tu primer procedimiento.
          Te toma menos de 30 segundos.
        </p>

        <Link
          to="/procedimientos"
          className="neta-btn-primary mt-8 inline-flex items-center justify-center gap-2 w-full md:w-auto md:px-10 text-base shadow-2xl"
        >
          Registrar mi primer cliente
          <ArrowRight size={18} />
        </Link>

        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center text-sm">
          <button
            onClick={exploreDemo}
            disabled={seeding || !userId}
            className="text-accent hover:text-primary transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {seeding
              ? <><Loader2 size={14} className="animate-spin" /> Cargando ejemplo…</>
              : <><Wand2 size={14} /> Explorar con datos de ejemplo</>}
          </button>
        </div>

        <p className="text-xs text-muted mt-10 leading-relaxed max-w-sm mx-auto">
          Te mostramos cómo se ve Neta llena. Podrás borrar el ejemplo de un clic cuando quieras.
        </p>
      </div>
    </div>
  )
}

function delta(current: number, prev: number, invert = false): { pct: number; up: boolean } | null {
  if (prev === 0) return null
  const pct = Math.round(((current - prev) / Math.abs(prev)) * 100)
  const up = invert ? pct <= 0 : pct >= 0
  return { pct, up }
}

function SummaryCard({
  label, value, icon, valueClass, hint,
  prev, current, prevLabel, invertDelta, isCount,
}: {
  label: string; value: string; icon?: React.ReactNode; valueClass?: string; hint?: string
  prev?: number; current?: number; prevLabel?: string; invertDelta?: boolean; isCount?: boolean
}) {
  const d = prev !== undefined && current !== undefined ? delta(current, prev, invertDelta) : null
  return (
    <div className="neta-card !p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted mb-2">{icon}{label}</div>
      <div className={`text-lg md:text-2xl font-semibold leading-tight ${valueClass ?? ''}`}>{value}</div>
      {hint && <div className="text-[11px] text-muted mt-1">{hint}</div>}
      {d !== null && (
        <div className={`text-[11px] mt-1.5 font-medium ${d.up ? 'text-positive' : 'text-negative'}`}>
          {d.pct >= 0 ? '+' : ''}{d.pct}% vs {prevLabel}
        </div>
      )}
    </div>
  )
}

interface BreakdownItem { label: string; count: number; value: number }

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

function BreakdownCard({ title, items, valueAsMoney, currency, colorBar, negative, topBadge }: {
  title: string; items: BreakdownItem[]; valueAsMoney?: boolean; currency?: string; colorBar?: boolean; negative?: boolean; topBadge?: string
}) {
  const total = items.reduce((s, i) => s + (valueAsMoney ? i.value : i.count), 0)
  return (
    <div className="neta-card">
      <h3 className="text-base font-semibold mb-4">{title}</h3>
      {items.length === 0 || total === 0 ? (
        <p className="text-sm text-muted py-2">Sin datos en este periodo.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, idx) => {
            const portion = valueAsMoney ? item.value : item.count
            const pct = total > 0 ? Math.round((portion / total) * 100) : 0
            return (
              <li key={item.label}>
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  <span className="text-sm flex-1 min-w-0 flex items-center gap-2">
                    <span className="truncate">{item.label}</span>
                    {idx === 0 && topBadge && items.length > 1 && (
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">{topBadge}</span>
                    )}
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    {valueAsMoney ? `${negative ? '-' : ''}${formatMoney(item.value, currency ?? 'COP')}` : `${item.count}`}
                  </span>
                  <span className="text-xs text-muted w-10 text-right tabular-nums">{pct}%</span>
                </div>
                <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: colorBar ? '#D4A96A' : negative ? '#FDA4AF' : '#E8A598' }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
