import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SelectOption = string | { value: string; label: string }

interface Props {
  value: string
  onChange: (v: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

function normalize(o: SelectOption): { value: string; label: string } {
  return typeof o === 'string' ? { value: o, label: o } : o
}

export default function Select({ value, onChange, options, placeholder, className, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const items = options.map(normalize)
  const current = items.find(i => i.value === value)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 bg-bg border rounded-xl px-4 py-3 text-left transition-colors',
          open ? 'border-accent' : 'border-border',
          !current && 'text-muted/70',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span className="truncate">{current?.label ?? placeholder ?? 'Selecciona...'}</span>
        <ChevronDown size={16} className={cn('text-muted shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div
          ref={listRef}
          className="absolute z-[60] mt-1 w-full max-h-64 overflow-auto bg-surface border border-border rounded-xl shadow-2xl py-1 animate-fade-in"
        >
          {items.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted">Sin opciones</div>
          ) : (
            items.map(opt => {
              const active = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-3 transition',
                    active ? 'text-accent bg-accent/5' : 'text-primary hover:bg-bg',
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {active && <Check size={14} className="shrink-0" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
