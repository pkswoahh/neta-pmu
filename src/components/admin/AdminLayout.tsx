import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Shield, Users, FileClock, ArrowLeft, LogOut, LayoutDashboard } from 'lucide-react'
import Logo from '@/components/Logo'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/usuarias', label: 'Usuarias', icon: Users, end: false },
  { to: '/admin/auditoria', label: 'Auditoría', icon: FileClock, end: false },
]

export default function AdminLayout() {
  const { signOut, user } = useAuth()
  const loc = useLocation()
  const currentTitle = tabs.find(t => (t.end ? loc.pathname === t.to : loc.pathname.startsWith(t.to)))?.label ?? 'Admin'

  return (
    <div className="min-h-dvh relative z-10 flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-bg/60 backdrop-blur-sm sticky top-0 h-dvh px-5 py-7">
        <div className="mb-2 px-2">
          <Logo size="md" />
        </div>
        <div className="flex items-center gap-2 px-2 mb-8 text-xs">
          <Shield size={12} className="text-gold" />
          <span className="text-gold uppercase tracking-wider">Admin</span>
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
        <div className="mt-auto space-y-1">
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:text-primary hover:bg-surface/60 transition"
          >
            <ArrowLeft size={18} />
            Volver a la app
          </NavLink>
          <div className="border-t border-border pt-3 mt-3">
            <div className="px-3 mb-2 text-xs">
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
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="md:hidden sticky top-0 z-20 bg-bg/85 backdrop-blur-md border-b border-border">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <NavLink to="/" className="text-muted hover:text-primary p-2 -ml-2" aria-label="Volver">
                <ArrowLeft size={18} />
              </NavLink>
              <Logo size="md" />
              <span className="text-[10px] uppercase tracking-wider text-gold border border-gold/30 rounded px-1.5 py-0.5 ml-1">Admin</span>
            </div>
            <button onClick={signOut} className="text-muted hover:text-primary p-2 -mr-2" aria-label="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
          <div className="px-5 pb-3 text-xs uppercase tracking-wider text-muted">{currentTitle}</div>
          <div className="px-5 pb-3 flex gap-1">
            {tabs.map(t => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  cn(
                    'text-xs px-3 py-1.5 rounded-lg transition',
                    isActive ? 'bg-surface text-primary' : 'text-muted hover:text-primary',
                  )
                }
              >
                {t.label}
              </NavLink>
            ))}
          </div>
        </header>
        <div className="px-5 md:px-10 py-6 md:py-10 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
