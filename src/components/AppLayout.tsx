import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Users, Wallet, Settings, LogOut } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/contexts/ProfileContext'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', label: 'Dashboard', shortLabel: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/procedimientos', label: 'Procedimientos', shortLabel: 'Servicios', icon: ClipboardList, end: false },
  { to: '/clientes', label: 'Clientes', shortLabel: 'Clientes', icon: Users, end: false },
  { to: '/gastos', label: 'Gastos', shortLabel: 'Gastos', icon: Wallet, end: false },
  { to: '/configuracion', label: 'Configuración', shortLabel: 'Config', icon: Settings, end: false },
]

export default function AppLayout() {
  const { signOut, user } = useAuth()
  const { profile } = useProfile()
  const loc = useLocation()
  const currentTitle = tabs.find(t => (t.end ? loc.pathname === t.to : loc.pathname.startsWith(t.to)))?.label ?? ''

  return (
    <div className="min-h-dvh relative z-10 flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-bg/60 backdrop-blur-sm sticky top-0 h-dvh px-5 py-7">
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

      {/* Main */}
      <main className="flex-1 min-w-0 has-bottom-nav">
        {/* Header mobile */}
        <header className="md:hidden sticky top-0 z-20 bg-bg/85 backdrop-blur-md border-b border-border">
          <div className="px-5 py-4 flex items-center justify-between">
            <Logo size="md" />
            <button onClick={signOut} className="text-muted hover:text-primary p-2 -mr-2" aria-label="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
          {currentTitle && (
            <div className="px-5 pb-3 text-xs uppercase tracking-wider text-muted">{currentTitle}</div>
          )}
        </header>

        <div className="px-5 md:px-10 py-6 md:py-10 max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-bg/95 backdrop-blur-lg border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="grid grid-cols-5">
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
