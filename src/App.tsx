import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ProfileProvider, useProfile } from '@/contexts/ProfileContext'
import { ToastProvider } from '@/components/Toast'
import { ConfirmProvider } from '@/components/Confirm'
import Particles from '@/components/Particles'
import AppLayout from '@/components/AppLayout'
import Login, { FullCenterLoader } from '@/pages/Login'
import Onboarding from '@/pages/Onboarding'
import RecoverPassword from '@/pages/RecoverPassword'
import Dashboard from '@/pages/Dashboard'
import Procedimientos from '@/pages/Procedimientos'
import Clientes from '@/pages/Clientes'
import Gastos from '@/pages/Gastos'
import Configuracion from '@/pages/Configuracion'

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <ProfileProvider>
            <Particles />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/cambiar-password" element={<RecoverPassword />} />
              <Route path="/bienvenida" element={<RequireAuth><Onboarding /></RequireAuth>} />
              <Route element={<RequireAuthAndOnboarded><AppLayout /></RequireAuthAndOnboarded>}>
                <Route index element={<Dashboard />} />
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
  const { profile, loading: pLoading } = useProfile()
  if (aLoading || pLoading) return <FullCenterLoader />
  if (!user) return <Navigate to="/login" replace />
  if (!profile?.business_name) return <Navigate to="/bienvenida" replace />
  return <>{children}</>
}
