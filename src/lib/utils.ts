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
