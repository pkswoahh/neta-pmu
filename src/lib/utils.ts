import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  COP: '$',
  USD: 'US$',
  ARS: '$',
  MXN: '$',
  VES: 'Bs.',
  EUR: '€',
}

export function currencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] ?? '$'
}

export function formatMoney(value: number, currency = 'COP'): string {
  const symbol = currencySymbol(currency)
  const fractionDigits = currency === 'COP' || currency === 'VES' ? 0 : 2
  const formatted = new Intl.NumberFormat('es', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Math.abs(value))
  const sign = value < 0 ? '-' : ''
  return `${sign}${symbol}${formatted}`
}

export function formatThousands(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return new Intl.NumberFormat('es').format(Number(digits))
}

export function parseThousands(formatted: string): number {
  const digits = formatted.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

export function todayISO(): string {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}

export function monthRange(yyyymm: string): { start: string; end: string } {
  const [y, m] = yyyymm.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, 1))
  const end = new Date(Date.UTC(y, m, 1))
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { start: fmt(start), end: fmt(end) }
}

export function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split('-').map(Number)
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ]
  return `${months[m - 1]} ${y}`
}

export function shiftMonth(yyyymm: string, delta: number): string {
  const [y, m] = yyyymm.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
