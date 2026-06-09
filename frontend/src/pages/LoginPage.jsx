import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    login({ nome: 'Admin', tipo: 'dono' })
    navigate('/dashboard')
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">💈</div>
        <h1 className="text-3xl font-bold text-gray-800">Barbearia</h1>
        <p className="text-gray-500 mt-2">Sistema de Gestão</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="admin@barbearia.com" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="••••••••" required />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Entrar
        </button>
      </form>
      <p className="text-center text-xs text-gray-400 mt-6">
        Fuso: Campo Grande (GMT-4)
      </p>
    </div>
  )
}
