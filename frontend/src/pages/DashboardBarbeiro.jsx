import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { comissoesAPI, agendamentosAPI } from '../services/api'
import { connectBarbeiro, disconnect, onNovoAgendamento, onComissaoAtualizada, removeListeners } from '../services/socket'
import { DollarSign, Clock, TrendingUp, History } from 'lucide-react'
import useAuthStore from '../store/authStore'

export default function DashboardBarbeiro() {
  const user = useAuthStore((s) => s.user)
  const barbeiroId = user?.id
  const [comissoes, setComissoes] = useState([])
  const [agendamentos, setAgendamentos] = useState([])
  const [resumo, setResumo] = useState({ total_produzido: 0, total_comissao: 0, total_vales: 0, total_atendimentos: 0 })

  useEffect(() => {
    const hoje = new Date()
    const segunda = new Date(hoje); segunda.setDate(hoje.getDate() - ((hoje.getDay() + 6) % 7))
    const domingo = new Date(segunda); domingo.setDate(segunda.getDate() + 6)
    const fmt = (d) => d.toISOString().split('T')[0]

    comissoesAPI.listar(barbeiroId).then(r => setComissoes(r.data)).catch(() => {})
    comissoesAPI.resumo(barbeiroId, { dataInicio: fmt(segunda), dataFim: fmt(domingo) }).then(r => setResumo(r.data.resumo || r.data)).catch(() => {})
    agendamentosAPI.listarPorBarbeiro(barbeiroId).then(r => setAgendamentos(r.data)).catch(() => {})

    connectBarbeiro(barbeiroId)
    onNovoAgendamento((data) => setAgendamentos(prev => [data.agendamento, ...prev]))
    onComissaoAtualizada((data) => {
      setComissoes(prev => [data.comissao, ...prev])
    })

    return () => { disconnect(); removeListeners() }
  }, [])

  return (
    <div>
      <Header title="Meu Dashboard" />
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg"><DollarSign size={20} className="text-green-600" /></div>
              <div><p className="text-xs text-gray-500">Comissão de Hoje</p><p className="text-lg font-bold">R$ {Number(resumo.total_comissao).toFixed(2)}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg"><TrendingUp size={20} className="text-blue-600" /></div>
              <div><p className="text-xs text-gray-500">Produzido na Semana</p><p className="text-lg font-bold">R$ {Number(resumo.total_produzido).toFixed(2)}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg"><History size={20} className="text-purple-600" /></div>
              <div><p className="text-xs text-gray-500">Vales</p><p className="text-lg font-bold">R$ {Number(resumo.total_vales).toFixed(2)}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg"><Clock size={20} className="text-orange-600" /></div>
              <div><p className="text-xs text-gray-500">Atendimentos</p><p className="text-lg font-bold">{resumo.total_atendimentos}</p></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Comissões Recentes</h2>
            <div className="space-y-3">
              {comissoes.slice(0, 10).map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">R$ {Number(c.valor_comissao).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{new Date(c.data_geracao).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${c.status === 'paga' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {c.status}
                  </span>
                </div>
              ))}
              {comissoes.length === 0 && <p className="text-gray-400 text-sm">Nenhuma comissão ainda</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Próximos Atendimentos</h2>
            <div className="space-y-3">
              {agendamentos.filter(a => a.status === 'agendado').slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{a.dependente_nome || a.titular_nome}</p>
                    <p className="text-xs text-gray-500">{a.servico_nome} - {a.hora_inicio.slice(0, 5)}</p>
                  </div>
                  <span className="text-blue-600 text-sm">{a.data?.slice(0, 10)}</span>
                </div>
              ))}
              {agendamentos.filter(a => a.status === 'agendado').length === 0 && <p className="text-gray-400 text-sm">Nenhum agendamento</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
