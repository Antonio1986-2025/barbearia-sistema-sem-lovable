import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { usuariosAPI } from '../services/api'
import { Search, User, Phone, Users } from 'lucide-react'

export default function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [termo, setTermo] = useState('')

  useEffect(() => {
    usuariosAPI.listar().then(r => setClientes(r.data)).catch(() => {})
  }, [])

  const filtrados = clientes.filter(c =>
    c.nome?.toLowerCase().includes(termo.toLowerCase()) ||
    c.telefone?.includes(termo.replace(/\D/g, ''))
  )

  return (
    <div>
      <Header title="Clientes" />
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input type="text" placeholder="Buscar por nome ou telefone..." value={termo}
              onChange={(e) => setTermo(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
          </div>
          <span className="text-sm text-gray-500">{filtrados.length} cliente{filtrados.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border divide-y">
          {filtrados.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full"><User size={20} className="text-blue-600" /></div>
                <div>
                  <p className="font-medium">{c.nome}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1"><Phone size={12} /> {c.telefone}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${c.ativo !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {c.ativo !== false ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          ))}
          {filtrados.length === 0 && <p className="p-6 text-center text-gray-400">Nenhum cliente encontrado</p>}
        </div>
      </div>
    </div>
  )
}
