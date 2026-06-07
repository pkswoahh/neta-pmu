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
// Mezcla pensada para que se vean: clientes nuevos vs frecuentes
// (algunas repiten entre mes anterior y este), todos los orígenes,
// tipos de procedimiento y métodos de pago.
const DEMO_PROCEDURES = [
  // Mes anterior
  { daysAgo: 45, client_name: 'Lucía Peña', procedure_type: 'Cejas', client_source: 'Instagram', payment_method: 'Efectivo', usd: 90 },
  { daysAgo: 40, client_name: 'Camila Soto', procedure_type: 'Delineado', client_source: 'Referido', payment_method: 'Nequi', usd: 70 },
  { daysAgo: 38, client_name: 'Daniela Mora', procedure_type: 'Labios', client_source: 'TikTok', payment_method: 'Transferencia', usd: 120 },
  { daysAgo: 34, client_name: 'Valentina Ríos', procedure_type: 'Labios', client_source: 'Instagram', payment_method: 'Efectivo', usd: 120 },
  { daysAgo: 28, client_name: 'Andrea Gil', procedure_type: 'Labios', client_source: 'Google', payment_method: 'Transferencia', usd: 130 },
  // Este mes
  { daysAgo: 9, client_name: 'Daniela Mora', procedure_type: 'Cejas', client_source: 'Cliente frecuente', payment_method: 'Nequi', usd: 90 },
  { daysAgo: 7, client_name: 'Mariana Cortés', procedure_type: 'Cejas', client_source: 'TikTok', payment_method: 'Efectivo', usd: 90 },
  { daysAgo: 5, client_name: 'Camila Soto', procedure_type: 'Labios', client_source: 'Cliente frecuente', payment_method: 'Transferencia', usd: 120 },
  { daysAgo: 4, client_name: 'Sara Luna', procedure_type: 'Labios', client_source: 'Instagram', payment_method: 'Transferencia', usd: 120 },
  { daysAgo: 2, client_name: 'Valentina Ríos', procedure_type: 'Cejas', client_source: 'Cliente frecuente', payment_method: 'Efectivo', usd: 90 },
  { daysAgo: 1, client_name: 'Paula Vega', procedure_type: 'Delineado', client_source: 'Referido', payment_method: 'Nequi', usd: 70 },
]

const DEMO_EXPENSES = [
  // Mes anterior
  { daysAgo: 36, description: 'Curso de corrección de color', category: 'Cursos', usd: 150 },
  { daysAgo: 33, description: 'Transporte a domicilios', category: 'Transporte', usd: 15 },
  { daysAgo: 32, description: 'Arriendo de cabina', category: 'Arriendo', usd: 200 },
  { daysAgo: 30, description: 'Pigmentos y agujas', category: 'Insumos', usd: 80 },
  // Este mes
  { daysAgo: 7, description: 'Pauta en Instagram', category: 'Marketing', usd: 40 },
  { daysAgo: 4, description: 'Anestésico y guantes', category: 'Insumos', usd: 60 },
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
