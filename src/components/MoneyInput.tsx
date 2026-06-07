import { useState } from 'react'
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
  // Truco anti-autofill de iOS: el campo arranca como readonly y solo se
  // vuelve editable al tocarlo. Eso desactiva la barra de tarjeta/contacto
  // que iOS/Chrome muestran ignorando autocomplete="off".
  const [readonly, setReadonly] = useState(true)
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none">
        {currencySymbol(currency)}
      </span>
      <input
        type="text"
        inputMode="numeric"
        name="neta-monto"
        autoComplete="off"
        autoCorrect="off"
        readOnly={readonly}
        onFocus={() => setReadonly(false)}
        onBlur={() => setReadonly(true)}
        className="neta-input pl-10"
        value={display}
        placeholder={placeholder}
        required={required}
        onChange={e => onChange(parseThousands(e.target.value))}
      />
    </div>
  )
}
