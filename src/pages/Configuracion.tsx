import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, Edit2, Check, X, Loader2, CreditCard, ChevronRight, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { translateError } from '@/lib/errors'
import { useProfile } from '@/contexts/ProfileContext'
import { useAuth } from '@/contexts/AuthContext'
import { stateLabel } from '@/lib/access'
import { useToast } from '@/components/Toast'
import { useConfirm } from '@/components/Confirm'
import MoneyInput from '@/components/MoneyInput'
import Select from '@/components/Select'
import { COUNTRIES, flagEmoji } from '@/lib/countries'
import { DEFAULT_REMINDER_TEMPLATE } from '@/lib/whatsapp'
import type { OptionType, UserOption } from '@/types/database'

const CURRENCIES = [
  { code: 'COP', name: 'Peso colombiano' },
  { code: 'USD', name: 'Dólar estadounidense' },
  { code: 'ARS', name: 'Peso argentino' },
  { code: 'MXN', name: 'Peso mexicano' },
  { code: 'VES', name: 'Bolívar venezolano' },
  { code: 'EUR', name: 'Euro' },
]

const SECTIONS: { type: OptionType; title: string; hint: string }[] = [
  { type: 'procedure', title: 'Mis procedimientos', hint: 'Registra todos los servicios que ofreces' },
  { type: 'payment_method', title: 'Métodos de pago', hint: 'Cómo te pagan tus clientes' },
  { type: 'client_source', title: 'Origen del cliente', hint: 'De dónde llegan tus clientes' },
  { type: 'expense_category', title: 'Categorías de gastos', hint: 'Para clasificar tus egresos' },
]

const USAGE_MAP: Record<OptionType, { table: 'procedures' | 'expenses'; field: string; unit: [string, string] }> = {
  procedure:        { table: 'procedures', field: 'procedure_type', unit: ['procedimiento', 'procedimientos'] },
  payment_method:   { table: 'procedures', field: 'payment_method', unit: ['procedimiento', 'procedimientos'] },
  client_source:    { table: 'procedures', field: 'client_source',  unit: ['procedimiento', 'procedimientos'] },
  expense_category: { table: 'expenses',   field: 'category',       unit: ['gasto', 'gastos'] },
}

async function countOptionUsage(type: OptionType, value: string, userId: string): Promise<number | null> {
  const cfg = USAGE_MAP[type]
  const { count, error } = await supabase
    .from(cfg.table)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq(cfg.field, value)
  if (error) return null
  return count ?? 0
}

export default function Configuracion() {
  const { profile, access, updateProfile, refresh } = useProfile()
  const toast = useToast()
  const confirm = useConfirm()

  const [businessName, setBusinessName] = useState(profile?.business_name ?? '')
  const [country, setCountry] = useState(profile?.country ?? 'CO')
  const [currency, setCurrency] = useState(profile?.currency ?? 'COP')
  const [goal, setGoal] = useState<number>(profile?.monthly_goal ?? 0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setBusinessName(profile?.business_name ?? '')
    setCountry(profile?.country ?? 'CO')
    setCurrency(profile?.currency ?? 'COP')
    setGoal(profile?.monthly_goal ?? 0)
  }, [profile])

  async function saveProfile() {
    // Cambiar de moneda no convierte los montos guardados: solo cambia
    // el símbolo. Si ya hay registros, lo avisamos para evitar confusión.
    if (profile && currency !== profile.currency) {
      const [{ count: pc }, { count: ec }] = await Promise.all([
        supabase.from('procedures').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
        supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
      ])
      const total = (pc ?? 0) + (ec ?? 0)
      if (total > 0) {
        const ok = await confirm({
          title: 'Cambiar de moneda',
          message: `Tienes ${total} registro${total === 1 ? '' : 's'} guardado${total === 1 ? '' : 's'}. Cambiar de moneda no convierte esos montos: solo cambia el símbolo que se muestra. Por ejemplo, 500.000 seguirá siendo 500.000, pero ahora con el nuevo símbolo. ¿Quieres continuar?`,
          confirmLabel: 'Sí, cambiar moneda',
          variant: 'danger',
        })
        if (!ok) return
      }
    }
    setSaving(true)
    try {
      await updateProfile({
        business_name: businessName.trim() || null,
        country,
        currency,
        monthly_goal: goal,
      })
      toast.show('Cambios guardados', 'success')
    } catch (e: any) {
      toast.show(translateError(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="hidden md:block">
        <h1 className="text-3xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-muted mt-2">Personaliza tu espacio de trabajo.</p>
      </div>

      <Link
        to="/mi-suscripcion"
        className="neta-card flex items-center gap-4 hover:bg-surface/80 transition-colors group"
      >
        <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <CreditCard size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium">Mi suscripción</div>
          <div className="text-xs text-muted mt-0.5">
            {access.state === 'trial'
              ? `En período de prueba${access.daysLeft !== undefined ? ` · ${access.daysLeft} ${access.daysLeft === 1 ? 'día restante' : 'días restantes'}` : ''}`
              : access.state === 'active'
                ? `Plan ${profile?.billing_plan === 'annual' ? 'Anual' : profile?.billing_plan === 'monthly' ? 'Mensual' : ''} · ${stateLabel(access.state)}`
                : stateLabel(access.state)}
          </div>
        </div>
        <ChevronRight size={18} className="text-muted group-hover:text-primary transition-colors shrink-0" />
      </Link>

      <div className="neta-card space-y-5">
        <h2 className="text-lg font-semibold">Mi negocio</h2>
        <div>
          <label className="neta-label">Nombre del negocio</label>
          <input
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            placeholder="Ej. Lina PMU Studio"
            autoComplete="off"
            autoCorrect="off"
            className="neta-input"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="neta-label">País</label>
            <Select
              value={country}
              onChange={setCountry}
              options={COUNTRIES.map(c => ({ value: c.iso, label: `${flagEmoji(c.iso)} ${c.name}` }))}
            />
          </div>
          <div>
            <label className="neta-label">Moneda</label>
            <Select
              value={currency}
              onChange={setCurrency}
              options={CURRENCIES.map(c => ({ value: c.code, label: `${c.code} — ${c.name}` }))}
            />
          </div>
        </div>
        <div>
          <label className="neta-label">Meta mensual de ingresos</label>
          <MoneyInput value={goal} onChange={setGoal} currency={currency} />
        </div>
        <div className="flex justify-center pt-1">
          <button onClick={saveProfile} disabled={saving} className="neta-btn-primary px-8 flex items-center justify-center gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            Guardar
          </button>
        </div>
      </div>

      <ReminderTemplateCard />

      {SECTIONS.map(s => (
        <OptionsSection key={s.type} type={s.type} title={s.title} hint={s.hint} onChanged={refresh} />
      ))}

      <p className="text-center text-xs text-muted pb-2">
        <Link to="/terminos" className="hover:text-primary transition-colors">Términos de Servicio</Link>
        {' · '}
        <Link to="/privacidad" className="hover:text-primary transition-colors">Política de Privacidad</Link>
      </p>
    </div>
  )
}

function ReminderTemplateCard() {
  const { profile, updateProfile } = useProfile()
  const toast = useToast()
  const [text, setText] = useState(profile?.reminder_template ?? DEFAULT_REMINDER_TEMPLATE)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setText(profile?.reminder_template ?? DEFAULT_REMINDER_TEMPLATE) }, [profile])

  async function save() {
    setSaving(true)
    try {
      await updateProfile({ reminder_template: text.trim() || null })
      toast.show('Plantilla guardada', 'success')
    } catch (e: any) {
      toast.show(translateError(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="neta-card space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle size={18} className="text-accent" /> Recordatorio de WhatsApp
        </h2>
        <p className="text-xs text-muted mt-1">El mensaje que se envía al recordar una cita. Personalízalo a tu estilo.</p>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        autoComplete="off"
        className="neta-input min-h-[120px] resize-none"
      />
      <div className="text-xs text-muted">
        Toca para insertar:
        <div className="flex flex-wrap gap-1.5 mt-2">
          {['{nombre}', '{procedimiento}', '{fecha}', '{hora}', '{negocio}'].map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setText(t => `${t}${p}`)}
              className="bg-bg border border-border rounded-lg px-2 py-1 text-accent hover:border-accent/50 transition"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-between items-center pt-1">
        <button onClick={() => setText(DEFAULT_REMINDER_TEMPLATE)} className="text-xs text-muted hover:text-primary">Restablecer</button>
        <button onClick={save} disabled={saving} className="neta-btn-primary px-8 flex items-center justify-center gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />} Guardar
        </button>
      </div>
    </div>
  )
}

function OptionsSection({ type, title, hint, onChanged }: { type: OptionType; title: string; hint: string; onChanged: () => void }) {
  const { user } = useAuth()
  const { byType } = useProfile()
  const toast = useToast()
  const confirm = useConfirm()
  const items = byType(type)

  const [adding, setAdding] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')

  async function addItem() {
    const value = adding.trim()
    if (!value || !user) return
    const order = items.length
    const { error } = await supabase.from('user_options').insert({ user_id: user.id, type, value, order })
    if (error) toast.show(translateError(error), 'error')
    else {
      setAdding('')
      await onChanged()
    }
  }

  async function deleteItem(opt: UserOption) {
    if (!user) return
    const usage = await countOptionUsage(type, opt.value, user.id)
    const cfg = USAGE_MAP[type]
    const recordWord = (n: number) => (n === 1 ? cfg.unit[0] : cfg.unit[1])

    let message: string
    if (usage === null) {
      message = `¿Eliminar "${opt.value}"? Los registros que ya usan esta opción seguirán mostrándola, pero no podrás elegirla en nuevos formularios.`
    } else if (usage === 0) {
      message = `¿Eliminar "${opt.value}"?`
    } else {
      message = `"${opt.value}" se usa en ${usage} ${recordWord(usage)} registrado${usage === 1 ? '' : 's'}. Esos no se borran, seguirán mostrando "${opt.value}", pero ya no podrás elegirla en nuevos formularios.`
    }

    const ok = await confirm({
      title: 'Eliminar opción',
      message,
      confirmLabel: usage && usage > 0 ? 'Eliminar de todos modos' : 'Eliminar',
      variant: 'danger',
    })
    if (!ok) return
    const { error } = await supabase.from('user_options').delete().eq('id', opt.id)
    if (error) toast.show(translateError(error), 'error')
    else {
      toast.show('Eliminado', 'success')
      await onChanged()
    }
  }

  async function saveEdit(opt: UserOption) {
    const value = editingValue.trim()
    if (!value) return
    const { error } = await supabase.from('user_options').update({ value }).eq('id', opt.id)
    if (error) toast.show(translateError(error), 'error')
    else {
      setEditingId(null)
      await onChanged()
    }
  }

  return (
    <div className="neta-card">
      <div className="mb-4">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-xs text-muted mt-1">{hint}</p>
      </div>

      <ul className="space-y-2">
        {items.map(opt => (
          <li key={opt.id} className="flex items-center gap-2 bg-bg border border-border rounded-xl px-3 py-2">
            {editingId === opt.id ? (
              <>
                <input
                  autoFocus
                  value={editingValue}
                  onChange={e => setEditingValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(opt); if (e.key === 'Escape') setEditingId(null) }}
                  autoComplete="off"
                  autoCorrect="off"
                  className="flex-1 bg-transparent focus:outline-none text-sm"
                />
                <button onClick={() => saveEdit(opt)} className="text-positive p-2 hover:bg-positive/10 rounded-lg"><Check size={16} /></button>
                <button onClick={() => setEditingId(null)} className="text-muted p-2 hover:bg-surface rounded-lg"><X size={16} /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{opt.value}</span>
                <button onClick={() => { setEditingId(opt.id); setEditingValue(opt.value) }} className="text-muted hover:text-primary p-2 rounded-lg" aria-label="Editar">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => deleteItem(opt)} className="text-muted hover:text-negative p-2 rounded-lg" aria-label="Eliminar">
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="flex gap-2 mt-4">
        <input
          value={adding}
          onChange={e => setAdding(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addItem() }}
          placeholder="Agregar nuevo"
          autoComplete="off"
          autoCorrect="off"
          className="neta-input flex-1"
        />
        <button onClick={addItem} disabled={!adding.trim()} className="neta-btn-primary px-4 flex items-center gap-1">
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
