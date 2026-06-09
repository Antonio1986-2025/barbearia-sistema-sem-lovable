import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { relatoriosAPI, barbeirosAPI } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6']

export default function RelatoriosPage() {
  const [faturamento, setFaturamento] = useState([])
  const [desempenho, setDesempenho] = useState([])
  const [servicos, setServicos] = useState([])
  const [clientes, setClientes] = useState([])
  const [meses, setMeses] = useState(30)

  useEffect(() => {
    const fim = new Date().toISOString().split('T')[0]
    const inicio = new Date(Date.now() - meses * 86400000).toISOString().split('T')[0]
    relatoriosAPI.faturamento({ dataInicio: inicio, dataFim: fim }).then(r => setFaturamento(r.data)).catch(() => {})
    relatoriosAPI.desempenho({ dataInicio: inicio, dataFim: fim }).then(r => setDesempenho(r.data)).catch(() => {})
    relatoriosAPI.servicosMaisVendidos().then(r => setServicos(r.data)).catch(() => {})
    relatoriosAPI.clientesFieis().then(r => setClientes(r.data)).catch(() => {})
  }, [meses])

  return (
    <div>
      <Header title="Relatórios" />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-gray-500">Período:</span>
          {[7, 15, 30, 90].map((d) => (
            <button key={d} onClick={() => setMeses(d)}
              className={`px-3 py-1 rounded text-sm ${meses === d ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
              {d} dias
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Faturamento</h2>
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
            <h2 className="text-lg font-semibold mb-4">Desempenho por Barbeiro</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={desempenho}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_produzido" fill="#2563eb" name="Produzido (R$)" />
                <Bar dataKey="total_atendimentos" fill="#16a34a" name="Atendimentos" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Serviços Mais Vendidos</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={servicos} dataKey="total_vendas" nameKey="nome" cx="50%" cy="50%" outerRadius={100} label>
                  {servicos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Top Clientes</h2>
            <div className="space-y-3">
              {clientes.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <div>
                      <p className="font-medium">{c.nome}</p>
                      <p className="text-xs text-gray-500">{c.telefone}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-blue-600">{c.total_visitas} visitas</span>
                </div>
              ))}
              {clientes.length === 0 && <p className="text-gray-400 text-sm">Nenhum cliente</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
