import { useEffect, useState } from 'react'
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

// El documento scrollea de forma nativa (pull-to-refresh y rebote naturales).
// El bottom nav es fijo abajo; el único problema en iOS es que el teclado,
// al abrirse, no encoge el viewport de layout, así que un elemento fijo
// quedaría flotando sobre el teclado. Solución: detectamos el teclado con la
// API visualViewport (mide el alto VISIBLE) y ocultamos el nav mientras está
// abierto. Es confiable incluso con el botón "esconder teclado" de Chrome,
// porque visualViewport vuelve a crecer al cerrarse el teclado sin depender
// del foco.
function useKeyboardOpen() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => setOpen(window.innerHeight - vv.height > 150)
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])
  return open
}

export default function AppLayout() {
  const { signOut, user } = useAuth()
  const { profile } = useProfile()
  const loc = useLocation()
  const keyboardOpen = useKeyboardOpen()
  const currentTitle = tabs.find(t => (t.end ? loc.pathname === t.to : loc.pathname.startsWith(t.to)))?.label ?? ''
  const isAdmin = profile?.role === 'admin' || profile?.role === 'support'

  return (
    <div className="relative z-10 min-h-dvh">
      {/* Sidebar desktop — fija; el contenido scrollea debajo */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 border-r border-border bg-bg/60 backdrop-blur-sm px-5 py-7 overflow-y-auto">
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

      {/* Columna principal */}
      <div className="md:ml-64 flex flex-col min-h-dvh">
        {/* Header mobile — sticky arriba */}
        <header className="md:hidden sticky top-0 z-20 bg-bg/85 backdrop-blur-md border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="px-5 py-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Logo size="md" />
              {profile?.business_name && (
                <span className="text-sm text-muted truncate border-l border-border pl-2">{profile.business_name}</span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
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

        {/* Contenido — fluye en el documento (scroll nativo). El padding-bottom
            mobile deja espacio para el bottom nav fijo. */}
        <main className="flex-1">
          <div className="px-5 md:px-10 py-6 md:py-10 max-w-5xl mx-auto pb-28 md:pb-10">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom nav mobile — fijo abajo; se oculta mientras el teclado está
          abierto para no flotar sobre él. */}
      <nav
        className={cn(
          'md:hidden fixed bottom-0 inset-x-0 z-30 bg-bg/95 backdrop-blur-lg border-t border-border',
          keyboardOpen && 'hidden',
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
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
