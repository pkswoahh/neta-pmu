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

export function monthShort(yyyymm: string): string {
  const [, m] = yyyymm.split('-').map(Number)
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return months[m - 1] ?? ''
}

export function shiftMonth(yyyymm: string, delta: number): string {
  const [y, m] = yyyymm.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

// ── Periodos (Hoy / Semana / Mes / Rango) ──────────────────────────
export type PeriodKind = 'today' | 'week' | 'month' | 'range'
export interface Period { kind: PeriodKind; month: string; from: string; to: string }

export function defaultPeriod(): Period {
  return { kind: 'month', month: currentMonth(), from: todayISO(), to: todayISO() }
}

export function addDaysISO(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

// Devuelve el rango [start, end) — end exclusivo, para usar con gte/lt.
export function periodRange(p: Period): { start: string; end: string } {
  if (p.kind === 'today') {
    const start = todayISO()
    return { start, end: addDaysISO(start, 1) }
  }
  if (p.kind === 'week') {
    const today = todayISO()
    const [y, m, d] = today.split('-').map(Number)
    const dow = (new Date(y, m - 1, d).getDay() + 6) % 7 // 0 = lunes
    const start = addDaysISO(today, -dow)
    return { start, end: addDaysISO(start, 7) }
  }
  if (p.kind === 'range') {
    const lo = p.from <= p.to ? p.from : p.to
    const hi = p.from <= p.to ? p.to : p.from
    return { start: lo, end: addDaysISO(hi, 1) }
  }
  return monthRange(p.month)
}

export function periodLabel(p: Period): string {
  if (p.kind === 'today') return 'Hoy'
  if (p.kind === 'week') return 'Esta semana'
  if (p.kind === 'range') return `${shortDate(p.from)} – ${shortDate(p.to)}`
  return monthLabel(p.month)
}

// Slug seguro para nombres de archivo (CSV).
export function periodSlug(p: Period): string {
  if (p.kind === 'today') return todayISO()
  if (p.kind === 'week') return `semana-${periodRange(p).start}`
  if (p.kind === 'range') return `${periodRange(p).start}_${p.to >= p.from ? p.to : p.from}`
  return p.month
}

export function relativeDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const that = new Date(y, m - 1, d).getTime()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((today.getTime() - that) / 86400000)

  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  if (diff === -1) return 'Mañana'
  if (diff > 1 && diff < 7) return `Hace ${diff} días`
  if (diff >= 7 && diff < 14) return 'Hace 1 semana'
  if (diff >= 14 && diff < 30) return `Hace ${Math.floor(diff / 7)} semanas`
  if (diff < 0 && diff > -7) return `En ${-diff} días`
  // Fallback: dd/mm/yyyy
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

export function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

const ACCENT_MAP: Record<string, string> = {
  a: 'a', á: 'a', à: 'a', ä: 'a', â: 'a',
  e: 'e', é: 'e', è: 'e', ë: 'e', ê: 'e',
  i: 'i', í: 'i', ì: 'i', ï: 'i', î: 'i',
  o: 'o', ó: 'o', ò: 'o', ö: 'o', ô: 'o',
  u: 'u', ú: 'u', ù: 'u', ü: 'u', û: 'u',
  ñ: 'n',
}

export function downloadCSV(rows: Record<string, string | number>[], filename: string) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const escape = (v: string | number) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function clientKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split('')
    .map(ch => ACCENT_MAP[ch] ?? ch)
    .join('')
    .replace(/\s+/g, ' ')
}
