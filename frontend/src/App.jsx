import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import LoginPage from './pages/LoginPage'
import DashboardBarbeiro from './pages/DashboardBarbeiro'
import DashboardAdmin from './pages/DashboardAdmin'
import AgendaPage from './pages/AgendaPage'
import ComissoesPage from './pages/ComissoesPage'
import TelaCaixa from './pages/TelaCaixa'
import RelatoriosPage from './pages/RelatoriosPage'
import ClientesPage from './pages/ClientesPage'
import useAuthStore from './store/authStore'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthLayout />}>
          <Route index element={<LoginPage />} />
        </Route>
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardAdmin />} />
          <Route path="barbeiro" element={<DashboardBarbeiro />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="comissoes" element={<ComissoesPage />} />
          <Route path="caixa" element={<TelaCaixa />} />
          <Route path="relatorios" element={<RelatoriosPage />} />
          <Route path="clientes" element={<ClientesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
