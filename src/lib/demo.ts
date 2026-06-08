import { supabase } from './supabase'

// Datos de ejemplo para que la usuaria vea la app "llena" antes de
// registrar lo suyo. Todo se marca con is_demo=true para poder
// borrarlo de un clic sin tocar datos reales (ver migración 010).

// Factores aproximados USD -> moneda local. No son tasas reales: solo
// sirven para que los montos demo se vean plausibles en cada país.
const FX: Record<string, number> = {
  USD: 1, EUR: 0.9, COP: 4000, MXN: 18, ARS: 1000, VES: 36,
}
// Paso de redondeo por moneda, para montos "bonitos" (no 483.271).
const ROUND: Record<string, number> = {
  USD: 5, EUR: 5, COP: 1000, MXN: 10, ARS: 500, VES: 5,
}

function scale(usd: number, currency: string): number {
  const fx = FX[currency] ?? 1
  const step = ROUND[currency] ?? 1
  return Math.max(step, Math.round((usd * fx) / step) * step)
}

function dateAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

// Montos en "USD base"; se escalan a la moneda de la usuaria.
// Cubre ~6 meses para que la tendencia, los rangos y la comparación
// "vs periodo anterior" se vean con datos. Clientes que repiten entre
// meses (frecuentes) y otras nuevas; variedad de orígenes, tipos y pagos.
const DEMO_PROCEDURES = [
  // ── Hace ~5 meses ──
  { daysAgo: 150, client_name: 'Lucía Peña', procedure_type: 'Cejas', client_source: 'Instagram', payment_method: 'Efectivo', usd: 90 },
  { daysAgo: 140, client_name: 'Andrea Gil', procedure_type: 'Labios', client_source: 'Google', payment_method: 'Transferencia', usd: 120 },
  { daysAgo: 132, client_name: 'Camila Soto', procedure_type: 'Delineado', client_source: 'Referido', payment_method: 'Nequi', usd: 70 },
  // ── Hace ~4 meses ──
  { daysAgo: 122, client_name: 'Daniela Mora', procedure_type: 'Labios', client_source: 'TikTok', payment_method: 'Transferencia', usd: 120 },
  { daysAgo: 115, client_name: 'Mariana Cortés', procedure_type: 'Cejas', client_source: 'Instagram', payment_method: 'Efectivo', usd: 90 },
  { daysAgo: 108, client_name: 'Valentina Ríos', procedure_type: 'Labios', client_source: 'Instagram', payment_method: 'Efectivo', usd: 120 },
  { daysAgo: 100, client_name: 'Camila Soto', procedure_type: 'Cejas', client_source: 'Cliente frecuente', payment_method: 'Nequi', usd: 90 },
  // ── Hace ~3 meses ──
  { daysAgo: 92, client_name: 'Sara Luna', procedure_type: 'Labios', client_source: 'TikTok', payment_method: 'Transferencia', usd: 120 },
  { daysAgo: 85, client_name: 'Paula Vega', procedure_type: 'Delineado', client_source: 'Referido', payment_method: 'Efectivo', usd: 70 },
  { daysAgo: 78, client_name: 'Daniela Mora', procedure_type: 'Cejas', client_source: 'Cliente frecuente', payment_method: 'Nequi', usd: 90 },
  { daysAgo: 70, client_name: 'Andrea Gil', procedure_type: 'Cejas', client_source: 'Cliente frecuente', payment_method: 'Efectivo', usd: 90 },
  // ── Hace ~2 meses ──
  { daysAgo: 64, client_name: 'Natalia Ruiz', procedure_type: 'Labios', client_source: 'Google', payment_method: 'Transferencia', usd: 130 },
  { daysAgo: 58, client_name: 'Valentina Ríos', procedure_type: 'Cejas', client_source: 'Cliente frecuente', payment_method: 'Efectivo', usd: 90 },
  { daysAgo: 52, client_name: 'Mariana Cortés', procedure_type: 'Labios', client_source: 'Cliente frecuente', payment_method: 'Nequi', usd: 120 },
  { daysAgo: 47, client_name: 'Carla Méndez', procedure_type: 'Delineado', client_source: 'Instagram', payment_method: 'Efectivo', usd: 70 },
  { daysAgo: 40, client_name: 'Sara Luna', procedure_type: 'Cejas', client_source: 'Cliente frecuente', payment_method: 'Transferencia', usd: 90 },
  // ── Mes anterior ──
  { daysAgo: 33, client_name: 'Lucía Peña', procedure_type: 'Labios', client_source: 'Cliente frecuente', payment_method: 'Efectivo', usd: 120 },
  { daysAgo: 27, client_name: 'Daniela Mora', procedure_type: 'Labios', client_source: 'Cliente frecuente', payment_method: 'Transferencia', usd: 120 },
  { daysAgo: 22, client_name: 'Paula Vega', procedure_type: 'Cejas', client_source: 'Cliente frecuente', payment_method: 'Nequi', usd: 90 },
  { daysAgo: 18, client_name: 'Andrea Gil', procedure_type: 'Labios', client_source: 'Cliente frecuente', payment_method: 'Efectivo', usd: 130 },
  { daysAgo: 12, client_name: 'Camila Soto', procedure_type: 'Labios', client_source: 'Cliente frecuente', payment_method: 'Transferencia', usd: 120 },
  // ── Este mes (incluye hoy y esta semana) ──
  { daysAgo: 6, client_name: 'Mariana Cortés', procedure_type: 'Cejas', client_source: 'Cliente frecuente', payment_method: 'Efectivo', usd: 90 },
  { daysAgo: 5, client_name: 'Sara Luna', procedure_type: 'Labios', client_source: 'Cliente frecuente', payment_method: 'Transferencia', usd: 120 },
  { daysAgo: 3, client_name: 'Valentina Ríos', procedure_type: 'Cejas', client_source: 'Cliente frecuente', payment_method: 'Nequi', usd: 90 },
  { daysAgo: 1, client_name: 'Gabriela Díaz', procedure_type: 'Labios', client_source: 'Instagram', payment_method: 'Transferencia', usd: 120 },
  { daysAgo: 0, client_name: 'Daniela Mora', procedure_type: 'Delineado', client_source: 'Cliente frecuente', payment_method: 'Efectivo', usd: 70 },
]

const DEMO_EXPENSES = [
  // ── Hace ~5 meses ──
  { daysAgo: 148, description: 'Arriendo de cabina', category: 'Arriendo', usd: 200 },
  { daysAgo: 138, description: 'Pigmentos y agujas', category: 'Insumos', usd: 80 },
  // ── Hace ~4 meses ──
  { daysAgo: 118, description: 'Arriendo de cabina', category: 'Arriendo', usd: 200 },
  { daysAgo: 110, description: 'Pauta en Instagram', category: 'Marketing', usd: 40 },
  // ── Hace ~3 meses ──
  { daysAgo: 88, description: 'Arriendo de cabina', category: 'Arriendo', usd: 200 },
  { daysAgo: 80, description: 'Curso de corrección de color', category: 'Cursos', usd: 150 },
  // ── Hace ~2 meses ──
  { daysAgo: 58, description: 'Arriendo de cabina', category: 'Arriendo', usd: 200 },
  { daysAgo: 50, description: 'Anestésico y guantes', category: 'Insumos', usd: 60 },
  // ── Mes anterior ──
  { daysAgo: 30, description: 'Arriendo de cabina', category: 'Arriendo', usd: 200 },
  { daysAgo: 24, description: 'Pigmentos y agujas', category: 'Insumos', usd: 80 },
  { daysAgo: 16, description: 'Transporte a domicilios', category: 'Transporte', usd: 15 },
  // ── Este mes ──
  { daysAgo: 5, description: 'Pauta en Instagram', category: 'Marketing', usd: 40 },
  { daysAgo: 1, description: 'Arriendo de cabina', category: 'Arriendo', usd: 200 },
]

export async function seedDemoData(userId: string, currency: string): Promise<void> {
  const procedures = DEMO_PROCEDURES.map(p => ({
    user_id: userId,
    date: dateAgo(p.daysAgo),
    client_name: p.client_name,
    client_phone: null,
    procedure_type: p.procedure_type,
    amount: scale(p.usd, currency),
    payment_method: p.payment_method,
    client_source: p.client_source,
    notes: null,
    is_demo: true,
  }))

  const expenses = DEMO_EXPENSES.map(e => ({
    user_id: userId,
    date: dateAgo(e.daysAgo),
    description: e.description,
    category: e.category,
    amount: scale(e.usd, currency),
    notes: null,
    is_demo: true,
  }))

  const [pRes, eRes] = await Promise.all([
    supabase.from('procedures').insert(procedures),
    supabase.from('expenses').insert(expenses),
  ])
  if (pRes.error) throw pRes.error
  if (eRes.error) throw eRes.error
}

export async function clearDemoData(userId: string): Promise<void> {
  const [pRes, eRes] = await Promise.all([
    supabase.from('procedures').delete().eq('user_id', userId).eq('is_demo', true),
    supabase.from('expenses').delete().eq('user_id', userId).eq('is_demo', true),
  ])
  if (pRes.error) throw pRes.error
  if (eRes.error) throw eRes.error
}

export async function hasDemoData(userId: string): Promise<boolean> {
  const { count } = await supabase
    .from('procedures')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_demo', true)
  return (count ?? 0) > 0
}
