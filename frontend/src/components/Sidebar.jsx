import { NavLink, useNavigate } from 'react-router-dom'
import { Calendar, BarChart3, DollarSign, Scissors, Users, LayoutDashboard, User, LogOut } from 'lucide-react'
import useAuthStore from '../store/authStore'

const adminLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard Admin' },
]

const barbeiroLinks = [
  { to: '/barbeiro', icon: User, label: 'Meu Dashboard' },
]

const comumLinks = [
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/comissoes', icon: DollarSign, label: 'Comissões' },
  { to: '/caixa', icon: Scissors, label: 'Caixa' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
]

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const isDonoAdmin = user?.tipo === 'dono' || user?.tipo === 'admin'
  const links = [
    ...(isDonoAdmin ? adminLinks : []),
    ...barbeiroLinks,
    ...comumLinks,
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
      <div className="text-2xl font-bold mb-8 flex items-center gap-2">
        💈 Barbearia
      </div>
      <nav className="space-y-1 flex-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <link.icon size={20} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="pt-4 border-t border-gray-700">
        <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-full px-4 py-2">
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
