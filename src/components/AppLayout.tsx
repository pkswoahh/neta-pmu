import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, ClipboardList, Users, Wallet, Settings, LogOut, Shield, AlertTriangle, Clock, Wand2, Loader2 } from 'lucide-react'
import Logo from './Logo'
import { useConfirm } from './Confirm'
import { useToast } from './Toast'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/contexts/ProfileContext'
import { clearDemoData, hasDemoData } from '@/lib/demo'
import { translateError } from '@/lib/errors'
import { cn, shortDate } from '@/lib/utils'

const tabs = [
  { to: '/dashboard', label: 'Dashboard', shortLabel: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/agenda', label: 'Agenda', shortLabel: 'Agenda', icon: CalendarDays, end: false },
  { to: '/procedimientos', label: 'Procedimientos', shortLabel: 'Servicios', icon: ClipboardList, end: false },
  { to: '/clientes', label: 'Clientes', shortLabel: 'Clientes', icon: Users, end: false },
  { to: '/gastos', label: 'Gastos', shortLabel: 'Gastos', icon: Wallet, end: false },
  { to: '/configuracion', label: 'Configuración', shortLabel: 'Config', icon: Settings, end: false },
]

// En iOS el teclado no encoge el viewport: lo superpone y empuja el documento
// hacia arriba, dejando un "scroll residual" al cerrarse que descolocaba el
// bottom nav (lo subía en la PWA, lo dejaba oculto en Chrome al usar el botón
// "esconder teclado", que cierra el teclado sin quitar el foco). En vez de
// detectar el teclado (frágil), bloqueamos el scroll del documento mientras la
// app está montada: el único scroll vive en <main>, así el documento nunca
// queda descolocado y la barra inferior se mantiene fija al fondo del marco.
function useLockDocumentScroll() {
  useEffect(() => {
    document.body.classList.add('app-shell-lock')
    return () => document.body.classList.remove('app-shell-lock')
  }, [])
}

// Pull-to-refresh propio sobre el contenedor de scroll. Como bloqueamos el
// scroll del documento (por el teclado) y la PWA instalada tampoco trae el
// gesto nativo, lo recreamos: al estar arriba del todo y arrastrar hacia abajo,
// mostramos un indicador y al soltar recargamos. Funciona igual en navegador y
// PWA. Solo se activa con gestos táctiles (en escritorio no hace nada).
function usePullToRefresh(ref: React.RefObject<HTMLElement>) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const pullRef = useRef(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const MAX = 80
    const TRIGGER = 60
    let startY = 0
    let active = false
    const set = (v: number) => { pullRef.current = v; setPull(v) }
    const onStart = (e: TouchEvent) => {
      active = el.scrollTop <= 0
      startY = e.touches[0].clientY
    }
    const onMove = (e: TouchEvent) => {
      if (!active) return
      if (el.scrollTop > 0) { active = false; set(0); return }
      const dy = e.touches[0].clientY - startY
      set(dy > 0 ? Math.min(dy * 0.4, MAX) : 0)
    }
    const onEnd = () => {
      if (!active) return
      active = false
      if (pullRef.current >= TRIGGER) {
        setRefreshing(true)
        setTimeout(() => window.location.reload(), 200)
      } else {
        set(0)
      }
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: true })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [ref])
  return { pull, refreshing }
}

export default function AppLayout() {
  const { signOut, user } = useAuth()
  const { profile, access } = useProfile()
  const loc = useLocation()
  useLockDocumentScroll()
  const mainRef = useRef<HTMLElement>(null)
  const { pull, refreshing } = usePullToRefresh(mainRef)
  const currentTitle = tabs.find(t => (t.end ? loc.pathname === t.to : loc.pathname.startsWith(t.to)))?.label ?? ''
  const isAdmin = profile?.role === 'admin' || profile?.role === 'support'

  return (
    <div className="app-shell-frame h-dvh relative z-10 flex">
      {/* Sidebar desktop */}
      <aside className="app-shell-frame hidden md:flex flex-col w-64 border-r border-border bg-bg/60 backdrop-blur-sm h-dvh flex-shrink-0 px-5 py-7">
        <div className="mb-8 px-2">
          <Logo size="lg" />
        </div>
        <nav className="flex flex-col gap-1">
          {tabs.map(t => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                  isActive ? 'bg-surface text-primary' : 'text-muted hover:text-primary hover:bg-surface/60',
                )
              }
            >
              <t.icon size={18} />
              {t.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition border border-gold/20',
                  isActive ? 'bg-gold/10 text-gold' : 'text-gold/80 hover:text-gold hover:bg-gold/5',
                )
              }
            >
              <Shield size={18} />
              Panel admin
            </NavLink>
          )}
        </nav>
        <div className="mt-auto border-t border-border pt-5">
          <div className="px-3 mb-3 text-xs">
            {profile?.business_name && (
              <p className="text-primary font-medium truncate">{profile.business_name}</p>
            )}
            <p className="text-muted truncate">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:text-negative hover:bg-surface/60 transition"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Columna principal — flex column que ocupa el alto restante */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Header mobile */}
        <header className="md:hidden flex-shrink-0 z-20 bg-bg/85 backdrop-blur-md border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="px-5 py-4 flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-1">
              {isAdmin && (
                <NavLink to="/admin" className="text-gold p-2 -mr-1" aria-label="Panel admin">
                  <Shield size={18} />
                </NavLink>
              )}
              <button onClick={signOut} className="text-muted hover:text-primary p-2 -mr-2" aria-label="Cerrar sesión">
                <LogOut size={18} />
              </button>
            </div>
          </div>
          {currentTitle && (
            <div className="px-5 pb-3 text-xs uppercase tracking-wider text-muted">{currentTitle}</div>
          )}
        </header>

        <AccessBanner />
        <DemoBanner />

        {/* Área de contenido con scroll interno */}
        <main ref={mainRef} className="flex-1 overflow-y-auto min-h-0 relative">
          {/* Indicador de pull-to-refresh */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 flex justify-center z-20"
            style={{ height: pull, opacity: Math.min(pull / 60, 1) }}
          >
            <Loader2 size={20} className={cn('text-accent mt-2', (refreshing || pull >= 60) && 'animate-spin')} />
          </div>
          <div
            style={{
              transform: pull ? `translateY(${pull}px)` : undefined,
              transition: pull ? 'none' : 'transform 0.2s ease',
            }}
          >
            <div className="px-5 md:px-10 py-6 md:py-10 max-w-5xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>

        {/* Bottom nav mobile — hijo flex al fondo del marco dvh. Con el scroll
            del documento bloqueado (useLockDocumentScroll) nunca se descoloca:
            mientras el teclado está abierto queda detrás de él, y al cerrarlo
            vuelve a su sitio sin recargar. */}
        <nav className="md:hidden flex-shrink-0 bg-bg/95 backdrop-blur-lg border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="grid grid-cols-6">
            {tabs.map(t => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-1 py-3 text-[10px] transition',
                    isActive ? 'text-accent' : 'text-muted',
                  )
                }
              >
                <t.icon size={20} />
                <span>{t.shortLabel}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}

function AccessBanner() {
  const { access } = useProfile()

  if (access.warning === 'trial_ending') {
    return (
      <div className="bg-accent/10 border-b border-accent/20 px-5 md:px-10 py-2.5 text-sm flex items-center justify-between gap-2 text-accent">
        <span className="flex items-center gap-2">
          <Clock size={14} />
          Tu trial termina en {access.daysLeft} {access.daysLeft === 1 ? 'día' : 'días'}.
          {access.endsAt && <> Vence el {shortDate(access.endsAt.slice(0, 10))}.</>}
        </span>
        <Link to="/suscribirse" className="font-medium underline underline-offset-2 whitespace-nowrap shrink-0">
          Ver planes →
        </Link>
      </div>
    )
  }
  if (access.warning === 'past_due') {
    return (
      <div className="bg-amber-400/10 border-b border-amber-400/20 px-5 md:px-10 py-2.5 text-sm flex items-center justify-between gap-2 text-amber-300">
        <span className="flex items-center gap-2">
          <AlertTriangle size={14} />
          Tu último pago falló. Actualiza tu método antes de perder acceso.
        </span>
        <Link to="/suscribirse" className="font-medium underline underline-offset-2 whitespace-nowrap shrink-0">
          Actualizar →
        </Link>
      </div>
    )
  }
  if (access.warning === 'canceled' && access.endsAt) {
    return (
      <div className="bg-muted/10 border-b border-border px-5 md:px-10 py-2.5 text-sm flex items-center justify-between gap-2 text-muted">
        <span className="flex items-center gap-2">
          <Clock size={14} />
          Tu suscripción está cancelada. Tendrás acceso hasta el {shortDate(access.endsAt.slice(0, 10))}.
        </span>
        <Link to="/suscribirse" className="hover:text-primary font-medium underline underline-offset-2 whitespace-nowrap shrink-0">
          Reactivar →
        </Link>
      </div>
    )
  }
  return null
}

function DemoBanner() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const toast = useToast()
  const [hasDemo, setHasDemo] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    hasDemoData(user.id).then(v => { if (!cancelled) setHasDemo(v) }).catch(() => {})
    return () => { cancelled = true }
  }, [user])

  if (!hasDemo || !user) return null

  async function clear() {
    const ok = await confirm({
      title: 'Empezar de cero',
      message: 'Vamos a borrar los datos de ejemplo para dejar tu cuenta limpia. Tus datos reales (si registraste alguno) no se tocan.',
      confirmLabel: 'Borrar ejemplo',
      variant: 'danger',
    })
    if (!ok) return
    setClearing(true)
    try {
      await clearDemoData(user!.id)
      window.location.assign('/dashboard')
    } catch (e: any) {
      toast.show(translateError(e, 'No pudimos borrar los datos de ejemplo.'), 'error')
      setClearing(false)
    }
  }

  return (
    <div className="bg-gold/10 border-b border-gold/20 px-5 md:px-10 py-2.5 text-sm flex items-center justify-between gap-2 text-gold">
      <span className="flex items-center gap-2">
        <Wand2 size={14} />
        Estás viendo datos de ejemplo.
      </span>
      <button
        onClick={clear}
        disabled={clearing}
        className="font-medium underline underline-offset-2 whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 hover:text-primary disabled:opacity-60"
      >
        {clearing ? <><Loader2 size={13} className="animate-spin" /> Borrando…</> : <>Empezar de cero →</>}
      </button>
    </div>
  )
}
