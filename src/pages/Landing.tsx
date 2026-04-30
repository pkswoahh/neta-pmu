import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  ArrowRight, Check, ChevronDown, Sparkles, Target, TrendingUp, TrendingDown,
  ClipboardList, Users, Wallet, Calendar, BarChart3, Smartphone, Globe, Heart,
  Eye, Hand, Scissors, GraduationCap, Apple,
} from 'lucide-react'
import Logo from '@/components/Logo'
import { useAuth } from '@/contexts/AuthContext'
import { FullCenterLoader } from '@/pages/Login'
import { cn } from '@/lib/utils'

// ──────────────────────────────────────────────────────────────────
// Hook: revela elementos al hacer scroll (fade + translate)
// ──────────────────────────────────────────────────────────────────
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function Reveal({
  children, delay = 0, className,
}: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
      className={cn(
        'transition-all duration-700 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
        className,
      )}
    >
      {children}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// Counter animado
// ──────────────────────────────────────────────────────────────────
function Counter({ to, suffix = '', duration = 1400 }: { to: number; suffix?: string; duration?: number }) {
  const { ref, visible } = useReveal<HTMLSpanElement>()
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!visible) return
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(to * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [visible, to, duration])
  return <span ref={ref}>{val.toLocaleString('es-CO')}{suffix}</span>
}

// ──────────────────────────────────────────────────────────────────
// Página
// ──────────────────────────────────────────────────────────────────
export default function Landing() {
  const { user, loading } = useAuth()
  if (loading) return <FullCenterLoader />
  if (user) return <Navigate to="/dashboard" replace />
  return (
    <div className="min-h-dvh relative z-10 text-primary">
      <Nav />
      <Hero />
      <PainSection />
      <RealityStrip />
      <HowItWorks />
      <Benefits />
      <BeforeAfter />
      <ForWhom />
      <SocialProof />
      <Faq />
      <Pricing />
      <FinalCta />
      <Footer />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// Nav
// ──────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header
      className={cn(
        'sticky top-0 z-30 transition-all',
        scrolled ? 'bg-bg/85 backdrop-blur-md border-b border-border' : 'bg-transparent',
      )}
    >
      <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
        <Logo size="md" />
        <div className="flex items-center gap-2 md:gap-3">
          <Link
            to="/login"
            className="text-sm text-muted hover:text-primary transition-colors px-3 py-2"
          >
            Entrar
          </Link>
          <Link
            to="/login?signup=1"
            className="text-sm bg-accent text-bg font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 transition"
          >
            Empezar
          </Link>
        </div>
      </div>
    </header>
  )
}

// ──────────────────────────────────────────────────────────────────
// Hero
// ──────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Glow nude */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-accent/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-40 -left-40 w-[400px] h-[400px] rounded-full bg-gold/10 blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-5 md:px-8 pt-12 md:pt-20 pb-16 md:pb-24 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
        <div className="space-y-6">
          <Reveal>
            <div className="inline-flex items-center gap-2 bg-surface border border-border rounded-full px-3 py-1.5 text-xs">
              <Sparkles size={12} className="text-accent" />
              <span className="text-muted">Hecho para micropigmentadoras</span>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              Tu negocio,{' '}
              <span className="relative inline-block">
                <span className="text-accent">claro como el agua</span>
                <span className="text-accent">.</span>
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="text-base md:text-lg text-muted leading-relaxed max-w-md">
              Registra tu trabajo, controla tus gastos y mira en tiempo real cuánto ganas — todo desde tu celular, sin Excel ni cuadernos.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to="/login?signup=1"
                className="neta-btn-primary inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base"
              >
                Empezar 14 días gratis <ArrowRight size={16} />
              </Link>
              <a
                href="#como-funciona"
                className="neta-btn-ghost inline-flex items-center justify-center px-6 py-3.5 text-base"
              >
                Ver cómo funciona
              </a>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <div className="flex items-center gap-4 text-xs text-muted pt-3">
              <div className="flex items-center gap-1.5"><Check size={13} className="text-positive" /> Sin tarjeta</div>
              <div className="flex items-center gap-1.5"><Check size={13} className="text-positive" /> Sin compromiso</div>
              <div className="flex items-center gap-1.5"><Check size={13} className="text-positive" /> Cancela cuando quieras</div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <DashboardMockup />
        </Reveal>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────
// Mockup inline del Dashboard
// ──────────────────────────────────────────────────────────────────
function DashboardMockup() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setProgress(78), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Halo detrás del mockup */}
      <div className="absolute -inset-6 bg-gradient-to-br from-accent/20 to-gold/10 rounded-3xl blur-2xl" />

      <div
        className="relative bg-bg border border-border rounded-3xl p-5 shadow-2xl shadow-accent/10"
        style={{ animation: 'float 6s ease-in-out infinite' }}
      >
        {/* Mock header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted">Mayo 2026</div>
            <div className="font-semibold mt-1">Hola, Lina PMU</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-accent text-xs font-semibold">
            LP
          </div>
        </div>

        {/* Card meta */}
        <div className="bg-surface border border-border rounded-2xl p-4 mb-3 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-accent/10 blur-2xl" />
          <div className="flex items-center gap-2 text-muted text-xs mb-2 relative">
            <Target size={13} /> Meta mensual
          </div>
          <p className="text-sm relative">
            Llevas <span className="font-semibold">$3.900.000</span> de <span className="text-muted">$5.000.000</span> — <span className="text-accent font-semibold">78%</span>
          </p>
          <div className="mt-3 h-2 bg-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-[1400ms] ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Cards resumen */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <MockSummary
            label="Ingresos"
            value="$3.9M"
            delta="+24%"
            up
            icon={<TrendingUp size={12} className="text-positive" />}
          />
          <MockSummary
            label="Gastos"
            value="$840K"
            delta="-8%"
            up
            icon={<TrendingDown size={12} className="text-negative" />}
          />
          <MockSummary
            label="Ganancia"
            value="$3.06M"
            valueClass="text-positive"
            delta="+31%"
            up
          />
          <MockSummary
            label="Procedimientos"
            value="23"
            hint="9 nuevas · 14 frecuentes"
            icon={<ClipboardList size={12} className="text-accent" />}
          />
        </div>

        {/* Mini breakdown */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="text-xs font-semibold mb-3">Clientes por origen</div>
          <div className="space-y-2.5">
            <MockBar label="Instagram" pct={56} count={13} color="#D4A96A" />
            <MockBar label="Referido" pct={30} count={7} color="#D4A96A" />
            <MockBar label="TikTok" pct={14} count={3} color="#D4A96A" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}

function MockSummary({ label, value, delta, up, hint, icon, valueClass }: {
  label: string; value: string; delta?: string; up?: boolean; hint?: string; icon?: React.ReactNode; valueClass?: string
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3">
      <div className="flex items-center gap-1 text-[10px] text-muted mb-1">{icon}{label}</div>
      <div className={cn('text-lg font-semibold leading-tight', valueClass)}>{value}</div>
      {hint && <div className="text-[9px] text-muted mt-0.5">{hint}</div>}
      {delta && (
        <div className={cn('text-[10px] mt-1 font-medium', up ? 'text-positive' : 'text-negative')}>
          {delta} vs Abril
        </div>
      )}
    </div>
  )
}

function MockBar({ label, pct, count, color }: { label: string; pct: number; count: number; color: string }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(pct), 800); return () => clearTimeout(t) }, [pct])
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1 text-xs">
        <span>{label}</span>
        <span className="text-muted">{count} <span className="text-[10px]">({pct}%)</span></span>
      </div>
      <div className="h-1.5 bg-bg rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-[1200ms] ease-out" style={{ width: `${w}%`, background: color }} />
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// Pain section
// ──────────────────────────────────────────────────────────────────
const PAINS = [
  '"No sé cuánto gané este mes."',
  '"Mis gastos se me van de las manos."',
  '"No sé si mi precio está bien puesto."',
  '"Tengo los datos de mis clientas regados."',
  '"He probado Excel y lo abandono en una semana."',
  '"No sé si voy a cumplir mi meta del mes."',
]

function PainSection() {
  return (
    <section className="py-20 md:py-28 px-5 md:px-8 relative">
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <div className="text-center mb-12 md:mb-16">
            <div className="text-xs uppercase tracking-wider text-accent mb-3">El problema</div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
              ¿Te suena familiar?
            </h2>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
          {PAINS.map((p, i) => (
            <Reveal key={p} delay={i * 80}>
              <div className="neta-card border-l-2 border-l-accent/40 hover:border-l-accent transition-colors">
                <p className="text-base md:text-lg italic text-primary/90 leading-relaxed">{p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────
// Reality strip
// ──────────────────────────────────────────────────────────────────
function RealityStrip() {
  return (
    <section className="py-16 md:py-20 px-5 md:px-8 relative">
      <div className="max-w-3xl mx-auto text-center">
        <Reveal>
          <p className="text-xl md:text-3xl font-medium leading-relaxed text-primary/90">
            Trabajaste <span className="text-accent">23 días</span> este mes.
            <br className="hidden md:inline" />
            ¿Sabes cuánto <span className="underline decoration-accent decoration-2 underline-offset-4">ganaste de verdad</span> después de tus gastos?
          </p>
        </Reveal>
        <Reveal delay={120}>
          <p className="text-muted mt-6 text-base md:text-lg leading-relaxed">
            El cuaderno no responde. Excel se abandona. Las notas del celular se pierden.
            <br className="hidden md:inline" />
            <span className="text-primary">Neta sí.</span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────
// How it works
// ──────────────────────────────────────────────────────────────────
const STEPS = [
  {
    n: 1,
    title: 'Registra en segundos',
    desc: 'Anota cada procedimiento y cliente desde tu celular en menos de 30 segundos. Sin escribir lo mismo dos veces.',
    icon: ClipboardList,
  },
  {
    n: 2,
    title: 'Controla tus gastos',
    desc: 'Insumos, arriendo, cursos, marketing — cada egreso queda categorizado. Sabes exactamente en qué se va el dinero.',
    icon: Wallet,
  },
  {
    n: 3,
    title: 'Decide con datos',
    desc: 'Ves tu ganancia neta real, tu progreso a la meta y de dónde vienen tus clientas. Tomas decisiones con números, no a ciegas.',
    icon: BarChart3,
  },
]

function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 md:py-28 px-5 md:px-8 relative">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div className="text-center mb-14 md:mb-20">
            <div className="text-xs uppercase tracking-wider text-accent mb-3">Cómo funciona</div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
              Tres pasos. Sin curva de aprendizaje.
            </h2>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5 md:gap-6">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="neta-card h-full relative overflow-hidden group hover:border-accent/40 transition-colors">
                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-accent/5 blur-2xl group-hover:bg-accent/10 transition-colors" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-5xl font-bold text-accent/30 leading-none">0{s.n}</span>
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                      <s.icon size={18} className="text-accent" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────
// Benefits grid
// ──────────────────────────────────────────────────────────────────
const BENEFITS = [
  { icon: Target, title: 'Claridad financiera', desc: 'Mira en un vistazo cuánto ganaste, cuánto gastaste y cuánto te queda real.' },
  { icon: Wallet, title: 'Control de gastos', desc: 'Cada egreso categorizado. Sabes exactamente en qué se va tu dinero.' },
  { icon: BarChart3, title: 'Meta mensual', desc: 'Una barra de progreso que te dice si vas bien o necesitas apretar.' },
  { icon: Users, title: 'Historial de clientas', desc: 'Cada cliente con sus visitas, gasto total y última fecha. En segundos.' },
  { icon: Sparkles, title: 'Origen de clientas', desc: 'Sabes si te traen Instagram, referidos o TikTok — y dónde invertir mejor.' },
  { icon: Smartphone, title: 'Funciona como app', desc: 'Instálala en tu celular como cualquier app. Mobile-first, sin distracciones.' },
]

function Benefits() {
  return (
    <section className="py-20 md:py-28 px-5 md:px-8 bg-surface/30 border-y border-border">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div className="text-center mb-14 md:mb-16">
            <div className="text-xs uppercase tracking-wider text-accent mb-3">Beneficios</div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
              Lo que ganas con Neta
            </h2>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={(i % 3) * 80}>
              <div className="neta-card h-full hover:-translate-y-1 hover:border-accent/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                  <b.icon size={18} className="text-accent" />
                </div>
                <h3 className="font-semibold mb-1.5">{b.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────
// Before / After
// ──────────────────────────────────────────────────────────────────
const BEFORE = [
  'Anotas en cuaderno y se pierde',
  'Excel que abandonas en una semana',
  'No sabes cuánto te queda de ganancia',
  'Cobras por intuición',
  'Olvidas registrar procedimientos',
  'Datos de clientas regados en WhatsApp',
]

const AFTER = [
  'Todo guardado en tu celular, siempre',
  'Diseñada para usar 30 segundos al día',
  'Ganancia neta visible en tiempo real',
  'Decides precios con datos reales',
  'Registras al instante, sin fricción',
  'Historial completo de cada clienta',
]

function BeforeAfter() {
  return (
    <section className="py-20 md:py-28 px-5 md:px-8">
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <div className="text-center mb-14 md:mb-16">
            <div className="text-xs uppercase tracking-wider text-accent mb-3">El cambio</div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
              Antes y después de Neta
            </h2>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <Reveal>
            <div className="neta-card border-border/60 h-full">
              <div className="text-xs uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-negative" /> Antes
              </div>
              <ul className="space-y-3">
                {BEFORE.map(b => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-muted">
                    <span className="text-negative mt-0.5 shrink-0">✕</span>
                    <span className="leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="neta-card border-accent/30 bg-accent/5 h-full">
              <div className="text-xs uppercase tracking-wider text-accent mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Con Neta
              </div>
              <ul className="space-y-3">
                {AFTER.map(a => (
                  <li key={a} className="flex items-start gap-2.5 text-sm">
                    <Check size={14} className="text-accent mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────
// For whom
// ──────────────────────────────────────────────────────────────────
const FOR = [
  { icon: Sparkles, title: 'Micropigmentadoras', tag: 'Hecha para ti' },
  { icon: Eye, title: 'Lashistas' },
  { icon: Hand, title: 'Manicuristas' },
  { icon: Heart, title: 'Esteticistas' },
  { icon: Scissors, title: 'Tatuadoras' },
  { icon: GraduationCap, title: 'Instructoras PMU' },
  { icon: Apple, title: 'Nutricionistas' },
  { icon: Calendar, title: 'Profesionales independientes' },
]

function ForWhom() {
  return (
    <section className="py-20 md:py-28 px-5 md:px-8 bg-surface/30 border-y border-border">
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <div className="text-center mb-12 md:mb-14">
            <div className="text-xs uppercase tracking-wider text-accent mb-3">Para quién</div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4">
              Pensada para profesionales independientes
            </h2>
            <p className="text-muted max-w-xl mx-auto leading-relaxed">
              Si trabajas sola, atiendes clientas con cita y manejas tus propios gastos — Neta es para ti.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {FOR.map((f, i) => (
            <Reveal key={f.title} delay={(i % 4) * 60}>
              <div
                className={cn(
                  'neta-card !p-4 flex flex-col items-center text-center transition-all hover:-translate-y-1',
                  f.tag ? 'border-accent/40 bg-accent/5' : 'hover:border-accent/30',
                )}
              >
                <f.icon size={20} className={cn('mb-2', f.tag ? 'text-accent' : 'text-muted')} />
                <div className="text-sm font-medium">{f.title}</div>
                {f.tag && <div className="text-[10px] text-accent uppercase tracking-wider mt-1">{f.tag}</div>}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────
// Social proof
// ──────────────────────────────────────────────────────────────────
const FLAGS = [
  { c: 'CO', name: 'Colombia' },
  { c: 'VE', name: 'Venezuela' },
  { c: 'AR', name: 'Argentina' },
  { c: 'MX', name: 'México' },
  { c: 'ES', name: 'España' },
  { c: 'DO', name: 'Rep. Dominicana' },
  { c: 'US', name: 'USA Latino' },
]

function flagEmoji(code: string): string {
  const A = 0x1f1e6
  const a = 'A'.charCodeAt(0)
  return code.split('').map(ch => String.fromCodePoint(A + ch.charCodeAt(0) - a)).join('')
}

function SocialProof() {
  return (
    <section className="py-20 md:py-28 px-5 md:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <Reveal>
          <div className="text-xs uppercase tracking-wider text-accent mb-3">Validado en campo</div>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6">
            <span className="text-accent">+<Counter to={40} /></span> micropigmentadoras
            <br />
            de <Counter to={7} /> países lo confirmaron.
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="text-muted text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Hablamos con ellas. Escuchamos sus dolores. Neta nació de cada conversación.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 md:gap-4">
            {FLAGS.map(f => (
              <div
                key={f.c}
                className="flex items-center gap-2 bg-surface border border-border rounded-full px-3 py-1.5 text-sm"
              >
                <span className="text-base leading-none">{flagEmoji(f.c)}</span>
                <span className="text-muted">{f.name}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────
// FAQ
// ──────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: '¿Y si la abandono como abandoné Excel?',
    a: 'Neta es mobile-first y registrar un procedimiento te toma menos de 30 segundos. Si usas WhatsApp, sabes usar Neta. No hay nada que aprender.',
  },
  {
    q: '$15 USD al mes, ¿no es mucho?',
    a: 'Si no sabes cuánto ganas, tampoco sabes si $15 es mucho. Un solo procedimiento mal cobrado te cuesta más que la suscripción de varios meses.',
  },
  {
    q: '¿Y si no me funciona?',
    a: 'Tienes 14 días gratis para probar. Sin tarjeta. Sin compromiso. Si no es para ti, simplemente no continúas.',
  },
  {
    q: 'Yo con el cuaderno me arreglo bien.',
    a: 'El cuaderno no te dice cuánto te queda de ganancia, no te muestra estadísticas, no te avisa si vas a cumplir tu meta y no te dice de dónde vienen tus mejores clientas.',
  },
  {
    q: 'No entiendo de finanzas ni de tecnología.',
    a: 'Está diseñada exactamente para alguien que no sabe nada de finanzas ni de tecnología. La interfaz es la más simple posible. Si sabes WhatsApp, sabes Neta.',
  },
  {
    q: '¿Mi información está segura?',
    a: 'Cada usuaria solo ve sus propios datos. Tu información es tuya. No la compartimos con nadie ni la usamos para entrenar nada.',
  },
  {
    q: 'No tengo tiempo de aprender una herramienta nueva.',
    a: 'No hay nada que aprender. El primer día ya estás registrando procedimientos. Te toma menos tiempo que escribir un mensaje.',
  },
  {
    q: '¿Para qué si voy al contador al final del año?',
    a: 'El contador te dice lo que pasó. Neta te dice lo que está pasando ahora — para que puedas corregir a tiempo, no en marzo del próximo año.',
  },
  {
    q: '¿Y si cierran la plataforma?',
    a: 'Neta es un producto de Marketing de Roberto, en operación activa con planes de crecimiento claros. Y siempre puedes exportar todos tus datos a CSV.',
  },
  {
    q: '¿Qué tiene que no tenga otra app?',
    a: 'Está hecha específicamente para micropigmentadoras. Cada campo, cada categoría, cada flujo fue pensado para tu trabajo — no es una app genérica de finanzas adaptada a medias.',
  },
]

function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="py-20 md:py-28 px-5 md:px-8">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <div className="text-center mb-12 md:mb-14">
            <div className="text-xs uppercase tracking-wider text-accent mb-3">Lo que te preguntas</div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
              Resolvamos tus dudas
            </h2>
          </div>
        </Reveal>

        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i
            return (
              <Reveal key={item.q} delay={i * 30}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className={cn(
                    'w-full text-left neta-card !p-4 transition-all hover:border-accent/30',
                    isOpen && 'border-accent/40',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium text-sm md:text-base">{item.q}</span>
                    <ChevronDown
                      size={18}
                      className={cn('text-muted shrink-0 mt-0.5 transition-transform', isOpen && 'rotate-180 text-accent')}
                    />
                  </div>
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-300 ease-out',
                      isOpen ? 'max-h-40 mt-3 opacity-100' : 'max-h-0 opacity-0',
                    )}
                  >
                    <p className="text-sm text-muted leading-relaxed">{item.a}</p>
                  </div>
                </button>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────
// Pricing
// ──────────────────────────────────────────────────────────────────
const PRICING_FEATURES = [
  'Procedimientos ilimitados',
  'Control completo de gastos',
  'Historial de cada clienta',
  'Dashboard con meta mensual',
  'Exportar todo a CSV',
  'App instalable en tu celular',
  '6 monedas (COP, USD, ARS, MXN, VES, EUR)',
  'Tus datos siempre seguros',
]

function Pricing() {
  return (
    <section className="py-20 md:py-28 px-5 md:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-accent/10 blur-[100px] pointer-events-none" />
      <div className="max-w-md mx-auto relative">
        <Reveal>
          <div className="text-center mb-10">
            <div className="text-xs uppercase tracking-wider text-accent mb-3">Precio simple</div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
              Un solo plan. Todo incluido.
            </h2>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="neta-card border-accent/30 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-bg text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              14 días gratis
            </div>

            <div className="text-center pt-2 pb-4">
              <span className="inline-block bg-accent/10 text-accent text-xs font-medium px-3 py-1 rounded-full mb-4">
                Neta Pro
              </span>
              <div>
                <span className="text-6xl font-bold tracking-tight">$15</span>
                <span className="text-muted text-sm"> USD / mes</span>
              </div>
              <p className="text-xs text-muted mt-2">Sin permanencia · Cancela cuando quieras</p>
            </div>

            <hr className="border-border" />

            <ul className="space-y-3 py-5">
              {PRICING_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <Check size={15} className="text-accent shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/login?signup=1"
              className="neta-btn-primary w-full flex items-center justify-center gap-2"
            >
              Empezar 14 días gratis <ArrowRight size={16} />
            </Link>
            <p className="text-center text-[11px] text-muted mt-3">
              Sin tarjeta de crédito · Sin compromiso
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────
// Final CTA
// ──────────────────────────────────────────────────────────────────
function FinalCta() {
  return (
    <section className="py-20 md:py-32 px-5 md:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent pointer-events-none" />
      <div className="max-w-3xl mx-auto text-center relative">
        <Reveal>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-6">
            Tu negocio merece <span className="text-accent">claridad</span>.
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="text-muted text-base md:text-xl leading-relaxed max-w-xl mx-auto mb-10">
            Empieza gratis hoy. En 30 segundos verás tu primer número claro.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <Link
            to="/login?signup=1"
            className="neta-btn-primary inline-flex items-center justify-center gap-2 px-8 py-4 text-base"
          >
            Empezar 14 días gratis <ArrowRight size={18} />
          </Link>
        </Reveal>
        <Reveal delay={280}>
          <p className="text-xs text-muted mt-4">Sin tarjeta · Sin compromiso · Cancela cuando quieras</p>
        </Reveal>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────
// Footer
// ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-border py-10 px-5 md:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <Logo size="md" />
          <p className="text-xs text-muted mt-2">Tu negocio, claro como el agua.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
          <Link to="/login" className="hover:text-primary transition-colors">Entrar</Link>
          <Link to="/login?signup=1" className="hover:text-primary transition-colors">Crear cuenta</Link>
          <Link to="/terminos" className="hover:text-primary transition-colors">Términos</Link>
          <Link to="/privacidad" className="hover:text-primary transition-colors">Privacidad</Link>
          <span className="flex items-center gap-1.5">
            <Globe size={11} /> LATAM · USA · España
          </span>
        </div>
      </div>
      <p className="text-center text-[11px] text-muted/70 mt-8">
        © {new Date().getFullYear()} Neta. Un producto de Marketing de Roberto.
      </p>
    </footer>
  )
}
