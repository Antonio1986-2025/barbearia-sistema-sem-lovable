import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { agendamentosAPI, barbeirosAPI } from '../services/api'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function AgendaPage() {
  const [barbeiros, setBarbeiros] = useState([])
  const [barbeiroId, setBarbeiroId] = useState('')
  const [agendamentos, setAgendamentos] = useState([])
  const [data, setData] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    barbeirosAPI.listar().then(r => {
      setBarbeiros(r.data)
      if (r.data.length > 0) setBarbeiroId(r.data[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (barbeiroId) {
      agendamentosAPI.listarPorBarbeiro(barbeiroId, data).then(r => setAgendamentos(r.data)).catch(() => {})
    }
  }, [barbeiroId, data])

  const mudarDia = (dias) => {
    const d = new Date(data)
    d.setDate(d.getDate() + dias)
    setData(d.toISOString().split('T')[0])
  }

  const horarios = []
  for (let h = 7; h <= 20; h++) {
    horarios.push(`${String(h).padStart(2, '0')}:00`)
    horarios.push(`${String(h).padStart(2, '0')}:30`)
  }

  return (
    <div>
      <Header title="Agenda" />
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <select value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)} className="border rounded-lg px-4 py-2">
            {barbeiros.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <button onClick={() => mudarDia(-1)} className="p-2 hover:bg-gray-100 rounded"><ChevronLeft size={20} /></button>
            <span className="font-medium text-lg">{new Date(data).toLocaleDateString('pt-BR')}</span>
            <button onClick={() => mudarDia(1)} className="p-2 hover:bg-gray-100 rounded"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="divide-y">
            {horarios.map((hora) => {
              const ag = agendamentos.find(a => a.hora_inicio?.slice(0, 5) === hora)
              return (
                <div key={hora} className="flex items-center hover:bg-gray-50">
                  <div className="w-20 px-4 py-3 text-sm text-gray-500 font-medium border-r">{hora}</div>
                  <div className="flex-1 px-4 py-3">
                    {ag ? (
                      <div className={`p-2 rounded-lg ${ag.status === 'concluido' ? 'bg-green-50' : ag.status === 'cancelado' ? 'bg-red-50' : 'bg-blue-50'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{ag.dependente_nome || ag.titular_nome}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${ag.status === 'concluido' ? 'bg-green-200 text-green-800' : ag.status === 'cancelado' ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'}`}>
                            {ag.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{ag.servico_nome} - R$ {Number(ag.preco).toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{ag.hora_inicio?.slice(0, 5)} - {ag.hora_fim?.slice(0, 5)}</p>
                      </div>
                    ) : (
                      <span className="text-gray-300 text-sm">Livre</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
