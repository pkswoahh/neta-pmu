import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COUNTRIES, flagEmoji } from '@/lib/countries'

interface Props {
  value: string                       // E.164 con '+' (ej. "+573001234567") o vacío
  onChange: (value: string) => void
  defaultCountry?: string | null      // país del perfil, para el caso local
  placeholder?: string
}

// Códigos más largos primero, para el match por prefijo (593 antes que 59…).
const SORTED = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
const dialOf = (iso: string) => COUNTRIES.find(c => c.iso === iso)?.dial ?? ''

// Separa un valor guardado en país + número nacional. Acepta E.164 ('+57…') y
// números locales antiguos (sin código → usa el país del perfil).
function parsePhone(value: string, fallbackIso: string): { iso: string; national: string } {
  const v = (value ?? '').trim()
  if (v.startsWith('+')) {
    const digits = v.slice(1).replace(/\D/g, '')
    const match = SORTED.find(c => digits.startsWith(c.dial))
    if (match) return { iso: match.iso, national: digits.slice(match.dial.length) }
    return { iso: fallbackIso, national: digits }
  }
  return { iso: fallbackIso, national: v.replace(/\D/g, '') }
}

export default function PhoneInput({ value, onChange, defaultCountry, placeholder }: Props) {
  const fallbackIso = defaultCountry && COUNTRIES.some(c => c.iso === defaultCountry) ? defaultCountry : 'CO'
  const parsed = useMemo(() => parsePhone(value, fallbackIso), [value, fallbackIso])
  const [iso, setIso] = useState(parsed.iso)
  const [national, setNational] = useState(parsed.national)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Re-sincroniza si el valor cambia desde afuera (ej. autocompletar de cliente).
  useEffect(() => { setIso(parsed.iso); setNational(parsed.national) }, [parsed.iso, parsed.national])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function emit(nextIso: string, nextNational: string) {
    const digits = nextNational.replace(/\D/g, '')
    onChange(digits ? `+${dialOf(nextIso)}${digits}` : '')
  }

  return (
    <div className="flex gap-2">
      <div ref={wrapRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={cn('flex items-center gap-1.5 bg-bg border rounded-xl px-3 py-3 transition-colors', open ? 'border-accent' : 'border-border')}
        >
          <span className="text-base leading-none">{flagEmoji(iso)}</span>
          <span className="text-sm tabular-nums">+{dialOf(iso)}</span>
          <ChevronDown size={14} className={cn('text-muted transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="absolute z-[60] mt-1 w-60 max-h-64 overflow-auto bg-surface border border-border rounded-xl shadow-2xl py-1 animate-fade-in">
            {COUNTRIES.map(c => (
              <button
                key={c.iso}
                type="button"
                onClick={() => { setIso(c.iso); emit(c.iso, national); setOpen(false) }}
                className={cn(
                  'w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 transition',
                  c.iso === iso ? 'text-accent bg-accent/5' : 'text-primary hover:bg-bg',
                )}
              >
                <span className="text-base leading-none">{flagEmoji(c.iso)}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-muted tabular-nums">+{c.dial}</span>
                {c.iso === iso && <Check size={14} className="shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
      <input
        type="tel"
        inputMode="tel"
        value={national}
        onChange={e => { const v = e.target.value; setNational(v); emit(iso, v) }}
        autoComplete="off"
        className="neta-input flex-1 min-w-0"
        placeholder={placeholder ?? 'Número'}
      />
    </div>
  )
}
