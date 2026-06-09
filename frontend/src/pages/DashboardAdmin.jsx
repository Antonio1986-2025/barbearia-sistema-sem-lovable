import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { relatoriosAPI } from '../services/api'
import { Calendar, DollarSign, FileText, Users } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'

export default function DashboardAdmin() {
  const [resumo, setResumo] = useState(null)
  const [faturamento, setFaturamento] = useState([])
  const [servicos, setServicos] = useState([])

  useEffect(() => {
    relatoriosAPI.resumo().then((r) => setResumo(r.data)).catch(() => {})
    relatoriosAPI.faturamento({ dataInicio: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0], dataFim: new Date().toISOString().split('T')[0] })
      .then((r) => setFaturamento(r.data)).catch(() => {})
    relatoriosAPI.servicosMaisVendidos().then((r) => setServicos(r.data)).catch(() => {})
  }, [])

  const cards = [
    { label: 'Faturamento Hoje', value: resumo ? `R$ ${Number(resumo.faturamentoHoje).toFixed(2)}` : '...', icon: DollarSign, color: 'bg-green-500' },
    { label: 'Agendamentos Hoje', value: resumo?.agendamentosHoje || '...', icon: Calendar, color: 'bg-blue-500' },
    { label: 'Comandas Abertas', value: resumo?.comandasAbertas || '...', icon: FileText, color: 'bg-yellow-500' },
    { label: 'Comissões Pendentes', value: resumo ? `R$ ${Number(resumo.comissoesPendentes).toFixed(2)}` : '...', icon: Users, color: 'bg-purple-500' },
  ]

  return (
    <div>
      <Header title="Dashboard Administrativo" />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((card, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center gap-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <card.icon size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Faturamento (últimos 30 dias)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={faturamento}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Serviços Mais Vendidos</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={servicos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_vendas" fill="#2563eb" name="Vendas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
