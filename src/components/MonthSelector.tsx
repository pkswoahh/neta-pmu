import { ChevronLeft, ChevronRight } from 'lucide-react'
import { monthLabel, shiftMonth } from '@/lib/utils'

interface Props {
  value: string
  onChange: (v: string) => void
}

export default function MonthSelector({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-1 bg-surface border border-border rounded-xl p-1">
      <button
        onClick={() => onChange(shiftMonth(value, -1))}
        className="p-2 rounded-lg hover:bg-bg text-muted hover:text-primary transition"
        aria-label="Mes anterior"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="px-3 text-sm font-medium capitalize min-w-[140px] text-center">
        {monthLabel(value)}
      </span>
      <button
        onClick={() => onChange(shiftMonth(value, 1))}
        className="p-2 rounded-lg hover:bg-bg text-muted hover:text-primary transition"
        aria-label="Mes siguiente"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
