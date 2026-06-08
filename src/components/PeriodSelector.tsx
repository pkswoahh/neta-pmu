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
  /** Acciones a la derecha de los chips (ej. exportar CSV, nuevo). */
  trailing?: React.ReactNode
}

export default function PeriodSelector({ value, onChange, trailing }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1 bg-surface border border-border rounded-xl p-1">
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
        {trailing}
      </div>

      {value.kind === 'month' && (
        <MonthSelector value={value.month} onChange={m => onChange({ ...value, month: m })} />
      )}

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
