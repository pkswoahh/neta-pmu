import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Mail, Phone, Globe, Calendar, ClipboardList, Wallet,
  TrendingUp, Users, Loader2, Ban, RotateCcw, Gift, GiftIcon, Clock,
  KeyRound, ChevronDown, ChevronUp,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { DashboardSkeleton } from '@/components/Skeleton'
import { computeAccess, stateLabel, stateBadgeClasses } from '@/lib/access'
import { COUNTRY_NAMES } from '@/lib/constants'
import { cn, formatMoney, relativeDate, shortDate } from '@/lib/utils'
import {
  SuspendModal, UnsuspendModal, CompModal, RemoveCompModal, ExtendTrialModal,
} from '@/components/admin/ActionModals'
import type { AdminUserDetail } from '@/types/database'

type ActionType = 'suspend' | 'unsuspend' | 'comp' | 'remove_comp' | 'extend_trial' | null

export default function UsuariaDetalle() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const toast = useToast()
  const [data, setData] = useState<AdminUserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<ActionType>(null)
  const [showRaw, setShowRaw] = useState(false)
  const [resetBusy, setResetBusy] = useState(false)

  async function load() {
    if (!id) return
    setLoading(true)
    const { data: detail, error } = await supabase.rpc('admin_user_detail', { target: id })
    if (error) {
      toast.show(error.message, 'error')
      setLoading(false)
      return
    }
    setData(detail as AdminUserDetail)
    setLoading(false)
  }

  useEffect(() => { void load() }, [id])

  async function sendPasswordReset() {
    if (!data?.profile.email) return
    setResetBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(data.profile.email, {
      redirectTo: `${window.location.origin}/cambiar-password`,
    })
    setResetBusy(false)
    if (error) toast.show(error.message, 'error')
    else toast.show('Email de reset enviado', 'success')
  }

  if (loading || !data) return <DashboardSkeleton />

  const { profile, stats } = data
  const access = computeAccess(profile)
  const currency = profile.currency
  const isSuspended = profile.subscription_status === 'suspended'
  const isComped = profile.subscription_status === 'comped'

  return (
    <div className="space-y-5 animate-fade-in">
      <button onClick={() => nav('/admin/usuarias')} className="text-sm text-muted hover:text-primary flex items-center gap-1.5">
        <ArrowLeft size={14} /> Volver a usuarias
      </button>

      {/* Header */}
      <div className="neta-card !p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-semibold text-xl shrink-0">
            {initials(profile.business_name ?? profile.email ?? '?')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-semibold truncate">
                {profile.business_name ?? <span className="italic text-muted">Sin negocio</span>}
              </h1>
              <span className={cn('text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border', stateBadgeClasses(access.state))}>
                {stateLabel(access.state)}
              </span>
              {profile.role !== 'user' && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border bg-gold/15 text-gold border-gold/30">
                  {profile.role}
                </span>
              )}
            </div>
            <div className="text-sm text-muted mt-1.5 space-y-1">
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                  <Mail size={13} />{profile.email}
                </a>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {profile.country && <span className="flex items-center gap-1.5"><Globe size={12} /> {COUNTRY_NAMES[profile.country] ?? profile.country}</span>}
                <span>{profile.currency}</span>
                <span className="flex items-center gap-1.5"><Calendar size={12} /> Registrada {shortDate(profile.created_at.slice(0, 10))}</span>
                {profile.last_seen_at && <span className="flex items-center gap-1.5"><Clock size={12} /> Activa {relativeDate(profile.last_seen_at.slice(0, 10))}</span>}
              </div>
            </div>
          </div>
        </div>

        {profile.suspended_reason && (
          <div className="mt-4 bg-negative/10 border border-negative/20 rounded-xl px-4 py-3">
            <div className="text-xs uppercase tracking-wider text-negative mb-1">Razón de suspensión</div>
            <div className="text-sm">{profile.suspended_reason}</div>
          </div>
        )}
      </div>

      {/* Stats de uso */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Procedimientos" value={String(stats.total_procedures)} icon={<ClipboardList size={14} className="text-accent" />} />
        <Stat label="Gastos" value={String(stats.total_expenses)} icon={<Wallet size={14} className="text-negative" />} />
        <Stat
          label="Ingresos 30 días"
          value={formatMoney(Number(stats.income_last_30d), currency)}
          icon={<TrendingUp size={14} className="text-positive" />}
        />
        <Stat label="Clientas únicas" value={String(stats.unique_clients)} icon={<Users size={14} className="text-accent" />} />
      </div>

      {/* Timeline de suscripción */}
      <div className="neta-card">
        <h3 className="text-base font-semibold mb-4">Estado de suscripción</h3>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Field label="Estado actual" value={stateLabel(access.state)} />
          <Field label="Trial vence" value={profile.trial_ends_at ? shortDate(profile.trial_ends_at.slice(0, 10)) : '—'} />
          {profile.comped_until !== null && (
            <Field label="Cortesía vence" value={profile.comped_until ? shortDate(profile.comped_until.slice(0, 10)) : 'Permanente'} />
          )}
          {profile.current_period_end && (
            <Field label="Período pago vence" value={shortDate(profile.current_period_end.slice(0, 10))} />
          )}
          {profile.canceled_at && (
            <Field label="Canceló el" value={shortDate(profile.canceled_at.slice(0, 10))} />
          )}
          {profile.suspended_at && (
            <Field label="Suspendida desde" value={shortDate(profile.suspended_at.slice(0, 10))} />
          )}
          {stats.first_procedure && (
            <Field label="Primer procedimiento" value={shortDate(stats.first_procedure)} />
          )}
          {stats.last_procedure && (
            <Field label="Último procedimiento" value={shortDate(stats.last_procedure)} />
          )}
        </dl>
      </div>

      {/* Acciones */}
      <div className="neta-card">
        <h3 className="text-base font-semibold mb-4">Acciones</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {!isSuspended && (
            <ActionBtn icon={<Ban size={16} />} label="Suspender" tone="danger" onClick={() => setAction('suspend')} />
          )}
          {isSuspended && (
            <ActionBtn icon={<RotateCcw size={16} />} label="Reactivar" tone="primary" onClick={() => setAction('unsuspend')} />
          )}
          {!isComped && (
            <ActionBtn icon={<Gift size={16} />} label="Otorgar cortesía" tone="primary" onClick={() => setAction('comp')} />
          )}
          {isComped && (
            <ActionBtn icon={<GiftIcon size={16} />} label="Quitar cortesía" tone="ghost" onClick={() => setAction('remove_comp')} />
          )}
          <ActionBtn icon={<Clock size={16} />} label="Extender trial" tone="ghost" onClick={() => setAction('extend_trial')} />
          <ActionBtn
            icon={resetBusy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
            label="Enviar reset de contraseña"
            tone="ghost"
            onClick={sendPasswordReset}
            disabled={resetBusy || !profile.email}
          />
        </div>
      </div>

      {/* Datos crudos */}
      <div className="neta-card">
        <button
          onClick={() => setShowRaw(s => !s)}
          className="w-full flex items-center justify-between text-sm text-muted hover:text-primary transition"
        >
          <span>Datos completos del perfil</span>
          {showRaw ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showRaw && (
          <pre className="mt-4 text-[11px] text-muted overflow-x-auto bg-bg p-3 rounded-lg leading-relaxed">
            {JSON.stringify({ profile, stats }, null, 2)}
          </pre>
        )}
      </div>

      {/* Modales */}
      {action === 'suspend' && (
        <SuspendModal
          open onClose={() => setAction(null)} onDone={() => { setAction(null); void load() }}
          targetUserId={profile.id}
          targetName={profile.business_name ?? profile.email ?? 'la usuaria'}
        />
      )}
      {action === 'unsuspend' && (
        <UnsuspendModal
          open onClose={() => setAction(null)} onDone={() => { setAction(null); void load() }}
          targetUserId={profile.id}
          targetName={profile.business_name ?? profile.email ?? 'la usuaria'}
        />
      )}
      {action === 'comp' && (
        <CompModal
          open onClose={() => setAction(null)} onDone={() => { setAction(null); void load() }}
          targetUserId={profile.id}
          targetName={profile.business_name ?? profile.email ?? 'la usuaria'}
        />
      )}
      {action === 'remove_comp' && (
        <RemoveCompModal
          open onClose={() => setAction(null)} onDone={() => { setAction(null); void load() }}
          targetUserId={profile.id}
          targetName={profile.business_name ?? profile.email ?? 'la usuaria'}
        />
      )}
      {action === 'extend_trial' && (
        <ExtendTrialModal
          open onClose={() => setAction(null)} onDone={() => { setAction(null); void load() }}
          targetUserId={profile.id}
          targetName={profile.business_name ?? profile.email ?? 'la usuaria'}
        />
      )}
    </div>
  )
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-bg border border-border rounded-xl px-3 py-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted mb-1">
        {icon}{label}
      </div>
      <div className="text-base font-semibold tabular-nums truncate">{value}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-right truncate">{value}</dd>
    </div>
  )
}

function ActionBtn({ icon, label, tone, onClick, disabled }: {
  icon: React.ReactNode; label: string; tone: 'primary' | 'danger' | 'ghost'
  onClick: () => void; disabled?: boolean
}) {
  const toneClass = {
    primary: 'bg-accent/10 border-accent/30 text-accent hover:bg-accent/20',
    danger: 'bg-negative/10 border-negative/30 text-negative hover:bg-negative/20',
    ghost: 'border-border text-primary hover:bg-surface',
  }[tone]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed',
        toneClass,
      )}
    >
      {icon}{label}
    </button>
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (!parts[0]) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
