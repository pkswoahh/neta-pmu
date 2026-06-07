import { useEffect, useRef, useState } from 'react'
import { clientKey } from '@/lib/utils'
import type { ClientStats } from '@/lib/clients'

interface Props {
  value: string
  onChange: (name: string) => void
  onSelect: (client: ClientStats) => void
  clients: ClientStats[]
}

// Campo de nombre con autocompletar: al escribir, sugiere clientes ya
// registrados. Seleccionar uno rellena el nombre exacto (y el celular,
// desde el form). Escribir un nombre que no existe = cliente nuevo.
export default function ClientNameInput({ value, onChange, onSelect, clients }: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const key = clientKey(value)
  const exact = key ? clients.find(c => c.key === key) : undefined
  // Con texto: clientes que contienen lo escrito (menos el que ya coincide
  // exacto). Sin texto: los más recientes, para elegir rápido.
  const list = (key ? clients.filter(c => c.key.includes(key) && c.key !== key) : clients).slice(0, 6)
  const showList = open && !exact && list.length > 0

  return (
    <div ref={wrapRef} className="relative">
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Escribe o busca un cliente"
        autoComplete="off"
        autoCorrect="off"
        required
        className="neta-input"
      />
      {showList && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-56 overflow-auto bg-surface border border-border rounded-xl shadow-2xl py-1 animate-fade-in">
          {list.map(c => (
            <button
              key={c.key}
              type="button"
              onMouseDown={e => { e.preventDefault(); onSelect(c); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-bg transition"
            >
              <span className="truncate">{c.displayName}</span>
              <span className="text-xs text-muted shrink-0">
                {c.visits} {c.visits === 1 ? 'cita' : 'citas'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
