import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ProfileProvider, useProfile } from '@/contexts/ProfileContext'
import { ToastProvider } from '@/components/Toast'
import { ConfirmProvider } from '@/components/Confirm'
import Particles from '@/components/Particles'
import AppLayout from '@/components/AppLayout'
import AdminLayout from '@/components/admin/AdminLayout'
import Login, { FullCenterLoader } from '@/pages/Login'
import Landing from '@/pages/Landing'
import Onboarding from '@/pages/Onboarding'
import RecoverPassword from '@/pages/RecoverPassword'
import SuscripcionVencida from '@/pages/SuscripcionVencida'
import CuentaSuspendida from '@/pages/CuentaSuspendida'
import Dashboard from '@/pages/Dashboard'
import Procedimientos from '@/pages/Procedimientos'
import Clientes from '@/pages/Clientes'
import Gastos from '@/pages/Gastos'
import Configuracion from '@/pages/Configuracion'
import AdminOverviewPage from '@/pages/admin/Overview'
import AdminUsuarias from '@/pages/admin/Usuarias'
import UsuariaDetalle from '@/pages/admin/UsuariaDetalle'
import Auditoria from '@/pages/admin/Auditoria'
import Codigos from '@/pages/admin/Codigos'
import Terminos from '@/pages/Terminos'
import Privacidad from '@/pages/Privacidad'
import Suscribirse from '@/pages/Suscribirse'

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <ProfileProvider>
            <Particles />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cambiar-password" element={<RecoverPassword />} />
              <Route path="/terminos" element={<Terminos />} />
              <Route path="/privacidad" element={<Privacidad />} />
              <Route path="/bienvenida" element={<RequireAuth><Onboarding /></RequireAuth>} />

              <Route path="/suscribirse" element={<RequireAuth><Suscribirse /></RequireAuth>} />
              <Route path="/suscripcion-vencida" element={<RequireAuth><SuscripcionVencida /></RequireAuth>} />
              <Route path="/cuenta-suspendida" element={<RequireAuth><CuentaSuspendida /></RequireAuth>} />

              <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                <Route path="/admin" element={<AdminOverviewPage />} />
                <Route path="/admin/usuarias" element={<AdminUsuarias />} />
                <Route path="/admin/usuarias/:id" element={<UsuariaDetalle />} />
                <Route path="/admin/codigos" element={<Codigos />} />
                <Route path="/admin/auditoria" element={<Auditoria />} />
              </Route>

              <Route element={<RequireAuthAndOnboarded><AppLayout /></RequireAuthAndOnboarded>}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="procedimientos" element={<Procedimientos />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="gastos" element={<Gastos />} />
                <Route path="configuracion" element={<Configuracion />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ProfileProvider>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <FullCenterLoader />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireAuthAndOnboarded({ children }: { children: React.ReactNode }) {
  const { user, loading: aLoading } = useAuth()
  const { profile, loading: pLoading, access } = useProfile()
  if (aLoading || pLoading) return <FullCenterLoader />
  if (!user) return <Navigate to="/login" replace />
  if (!profile?.business_name) return <Navigate to="/bienvenida" replace />

  // Gating de suscripción
  if (!access.allowed) {
    if (access.state === 'suspended') return <Navigate to="/cuenta-suspendida" replace />
    return <Navigate to="/suscripcion-vencida" replace />
  }
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading: aLoading } = useAuth()
  const { profile, loading: pLoading } = useProfile()
  if (aLoading || pLoading) return <FullCenterLoader />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role !== 'admin' && profile?.role !== 'support') {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

