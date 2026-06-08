import MonthSelector from './MonthSelector'
import { addDaysISO, cn } from '@/lib/utils'
import type { Period, PeriodKind } from '@/lib/utils'

const CHIPS: { kind: PeriodKind; label: string }[] = [
  { kind: 'today', label: 'Hoy' },
  { kind: 'week', label: 'Semana' },
  { kind: 'month', label: 'Mes' },
  { kind: 'range', label: 'Rango' },
]

interface Props {
  value: Period
  onChange: (p: Period) => void
  /** Acciones a la derecha del navegador de periodo (ej. exportar CSV, nuevo). */
  trailing?: React.ReactNode
}

export default function PeriodSelector({ value, onChange, trailing }: Props) {
  // La 2ª fila (navegador de periodo + acciones) aparece cuando hay mes que
  // navegar o cuando hay acciones (CSV / nuevo). Para Hoy/Semana sin acciones
  // no mostramos nada (ej. en el Dashboard), para no meter ruido.
  const showRow2 = value.kind === 'month' || !!trailing

  const nav = value.kind === 'month'
    ? <MonthSelector value={value.month} onChange={m => onChange({ ...value, month: m })} />
    : (
      <div className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-muted">
        {value.kind === 'today' ? 'Hoy' : value.kind === 'week' ? 'Esta semana' : 'Rango personalizado'}
      </div>
    )

  return (
    <div className="flex flex-col gap-2">
      {/* Fila 1: solo los chips, a todo el ancho */}
      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
        {CHIPS.map(c => (
          <button
            key={c.kind}
            type="button"
            onClick={() => onChange(
              // Al entrar a "Rango", si está en hoy–hoy (sin rango útil),
              // arranca con una ventana de 7 días para que ambas fechas se muevan.
              c.kind === 'range' && value.from >= value.to
                ? { ...value, kind: 'range', from: addDaysISO(value.to, -6) }
                : { ...value, kind: c.kind },
            )}
            className={cn(
              'flex-1 px-2 py-1.5 rounded-lg text-sm font-medium transition',
              value.kind === c.kind ? 'bg-accent text-bg' : 'text-muted hover:text-primary hover:bg-bg',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Fila 2: navegador de periodo (izquierda) + acciones (derecha) */}
      {showRow2 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">{nav}</div>
          {trailing}
        </div>
      )}

      {/* Fila 3: inputs de rango personalizado */}
      {value.kind === 'range' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.from}
            max={value.to}
            onChange={e => onChange({ ...value, from: e.target.value })}
            className="neta-input !py-2.5 text-sm flex-1 min-w-0"
            aria-label="Desde"
          />
          <span className="text-muted shrink-0">–</span>
          <input
            type="date"
            value={value.to}
            min={value.from}
            onChange={e => onChange({ ...value, to: e.target.value })}
            className="neta-input !py-2.5 text-sm flex-1 min-w-0"
            aria-label="Hasta"
          />
        </div>
      )}
    </div>
  )
}
