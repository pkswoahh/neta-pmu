import { formatThousands, parseThousands, currencySymbol } from '@/lib/utils'

interface Props {
  value: number
  onChange: (n: number) => void
  currency: string
  placeholder?: string
  required?: boolean
}

export default function MoneyInput({ value, onChange, currency, placeholder = '0', required }: Props) {
  const display = value ? formatThousands(String(value)) : ''
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none">
        {currencySymbol(currency)}
      </span>
      <input
        type="text"
        inputMode="numeric"
        className="neta-input pl-10"
        value={display}
        placeholder={placeholder}
        required={required}
        onChange={e => onChange(parseThousands(e.target.value))}
      />
    </div>
  )
}
