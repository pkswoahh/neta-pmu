import { clientKey } from './utils'
import type { Procedure } from '@/types/database'

export interface ClientStats {
  key: string
  displayName: string
  phone: string | null
  total: number
  visits: number
  firstVisit: string
  lastVisit: string
  topProcedure: { name: string; count: number } | null
  procedures: Procedure[]
}

export function aggregateClients(procedures: Procedure[]): ClientStats[] {
  const map = new Map<string, ClientStats>()

  for (const p of procedures) {
    const key = clientKey(p.client_name)
    if (!key) continue
    const cur = map.get(key)
    if (!cur) {
      map.set(key, {
        key,
        displayName: p.client_name.trim(),
        phone: p.client_phone,
        total: Number(p.amount),
        visits: 1,
        firstVisit: p.date,
        lastVisit: p.date,
        topProcedure: null,
        procedures: [p],
      })
    } else {
      cur.total += Number(p.amount)
      cur.visits += 1
      cur.procedures.push(p)
      if (p.date > cur.lastVisit) {
        cur.lastVisit = p.date
        cur.displayName = p.client_name.trim()
      }
      if (p.date < cur.firstVisit) cur.firstVisit = p.date
      if (p.client_phone && !cur.phone) cur.phone = p.client_phone
    }
  }

  for (const stats of map.values()) {
    const counts = new Map<string, number>()
    for (const p of stats.procedures) {
      counts.set(p.procedure_type, (counts.get(p.procedure_type) ?? 0) + 1)
    }
    let top: { name: string; count: number } | null = null
    for (const [name, count] of counts.entries()) {
      if (!top || count > top.count) top = { name, count }
    }
    stats.topProcedure = top
    stats.procedures.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  }

  return [...map.values()].sort((a, b) => (a.lastVisit < b.lastVisit ? 1 : a.lastVisit > b.lastVisit ? -1 : 0))
}

export function findClient(procedures: Procedure[], name: string): ClientStats | null {
  const key = clientKey(name)
  if (!key) return null
  const all = aggregateClients(procedures.filter(p => clientKey(p.client_name) === key))
  return all[0] ?? null
}
