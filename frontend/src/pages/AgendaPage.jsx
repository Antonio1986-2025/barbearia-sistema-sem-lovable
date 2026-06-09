import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { agendamentosAPI, barbeirosAPI, servicosAPI, usuariosAPI } from '../services/api'
import { ChevronLeft, ChevronRight, Plus, Play, Check, X, Moon } from 'lucide-react'

export default function AgendaPage() {
  const [barbeiros, setBarbeiros] = useState([])
  const [barbeiroId, setBarbeiroId] = useState('')
  const [agendamentos, setAgendamentos] = useState([])
  const [horarios, setHorarios] = useState([])
  const [data, setData] = useState(() => new Date().toISOString().split('T')[0])

  const [showNovo, setShowNovo] = useState(false)
  const [servicos, setServicos] = useState([])
  const [slotsDisponiveis, setSlotsDisponiveis] = useState([])
  const [termoCliente, setTermoCliente] = useState('')
  const [clienteEncontrado, setClienteEncontrado] = useState(null)
  const [dependentes, setDependentes] = useState([])
  const [dependenteId, setDependenteId] = useState('')
  const [servicoId, setServicoId] = useState('')
  const [horaEscolhida, setHoraEscolhida] = useState('')

  useEffect(() => {
    barbeirosAPI.listar().then(r => { setBarbeiros(r.data); if (r.data.length) setBarbeiroId(r.data[0].id) }).catch(() => {})
    servicosAPI.listar().then(r => setServicos(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!barbeiroId) return
    const dia = new Date(data + 'T12:00:00').getDay()
    barbeirosAPI.horarios(barbeiroId).then(r => setHorarios((r.data || []).filter(h => h.dia_semana === dia && h.ativo))).catch(() => setHorarios([]))
    carregarAgendamentos()
  }, [barbeiroId, data])

  const carregarAgendamentos = () => {
    agendamentosAPI.listarPorBarbeiro(barbeiroId, data).then(r => setAgendamentos(Array.isArray(r.data) ? r.data : [])).catch(() => setAgendamentos([]))
  }

  const mudarDia = (dias) => {
    const d = new Date(data + 'T12:00:00'); d.setDate(d.getDate() + dias)
    setData(d.toISOString().split('T')[0])
  }

  const buscarCliente = async () => {
    const tel = termoCliente.replace(/\D/g, '')
    if (!tel) return
    try {
      const r = await usuariosAPI.buscarTelefone(tel)
      setClienteEncontrado(r.data)
      setDependentes(r.data.dependentes || [])
      setDependenteId('')
    } catch { alert('Cliente não encontrado') }
  }

  useEffect(() => {
    if (servicoId && barbeiroId && data) {
      agendamentosAPI.horariosDisponiveis(barbeiroId, servicoId, data).then(r => setSlotsDisponiveis(r.data.horarios || [])).catch(() => setSlotsDisponiveis([]))
    }
  }, [servicoId, barbeiroId, data])

  const criarAgendamento = async (e) => {
    e.preventDefault()
    if (!clienteEncontrado || !servicoId || !horaEscolhida) return
    try {
      await agendamentosAPI.criar({
        usuarioTitularId: clienteEncontrado.id,
        dependenteId: dependenteId || null,
        barbeiroId,
        servicoId,
        data,
        horaInicio: horaEscolhida
      })
      setShowNovo(false); setTermoCliente(''); setClienteEncontrado(null); setDependentes([]); setDependenteId(''); setServicoId(''); setHoraEscolhida('')
      carregarAgendamentos()
    } catch (err) { alert('Erro ao agendar') }
  }

  const iniciar = async (id) => { try { await agendamentosAPI.iniciar(id); carregarAgendamentos() } catch { alert('Erro ao iniciar') } }
  const concluir = async (id) => { try { await agendamentosAPI.concluir(id); carregarAgendamentos() } catch { alert('Erro ao concluir') } }
  const cancelar = async (id) => {
    const motivo = prompt('Motivo do cancelamento:')
    if (!motivo) return
    try { await agendamentosAPI.cancelar(id, motivo); carregarAgendamentos() } catch { alert('Erro ao cancelar') }
  }
  const toggleNoturno = async () => {
    try {
      if (noturnoAtivo) await barbeirosAPI.desativarNoturno(barbeiroId, data)
      else await barbeirosAPI.ativarNoturno(barbeiroId, data)
      setNoturnoAtivo(!noturnoAtivo)
    } catch { alert('Erro ao alterar noturno') }
  }

  const [noturnoAtivo, setNoturnoAtivo] = useState(false)
  useEffect(() => {
    if (!barbeiroId) return
    agendamentosAPI.listarPorBarbeiro(barbeiroId, data).then(() => {}).catch(() => {})
  }, [noturnoAtivo])

  const gerarSlots = () => {
    const slots = []
    for (const h of horarios) {
      const [hI, mI] = h.hora_inicio.split(':').map(Number)
      const [hF, mF] = h.hora_fim.split(':').map(Number)
      let ini = hI * 60 + mI
      const fim = hF * 60 + mF
      while (ini < fim) {
        slots.push(`${String(Math.floor(ini / 60)).padStart(2, '0')}:${String(ini % 60).padStart(2, '0')}`)
        ini += 30
      }
    }
    if (noturnoAtivo) {
      for (let h = 19; h < 21; h++) { slots.push(`${String(h).padStart(2, '0')}:00`); slots.push(`${String(h).padStart(2, '0')}:30`) }
    }
    return [...new Set(slots)].sort()
  }

  const formatTime = (t) => { if (!t) return ''; const s = String(t); return s.length >= 5 ? s.substring(0, 5) : s }
  const slots = gerarSlots()

  return (
    <div>
      <Header title="Agenda" />
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <select value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)} className="border rounded-lg px-4 py-2">
            <option value="">Selecione barbeiro</option>
            {barbeiros.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <button onClick={() => mudarDia(-1)} className="p-2 hover:bg-gray-100 rounded"><ChevronLeft size={20} /></button>
            <span className="font-medium text-lg">{new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
            <button onClick={() => mudarDia(1)} className="p-2 hover:bg-gray-100 rounded"><ChevronRight size={20} /></button>
          </div>
          <button onClick={() => setShowNovo(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus size={18} /> Novo Agendamento
          </button>
          <button onClick={toggleNoturno} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${noturnoAtivo ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
            <Moon size={16} /> Noturno {noturnoAtivo ? 'Ativo' : 'Inativo'}
          </button>
        </div>

        {showNovo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNovo(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">Novo Agendamento</h2>
              <form onSubmit={criarAgendamento} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cliente (telefone)</label>
                  <div className="flex gap-2">
                    <input type="tel" value={termoCliente} onChange={e => setTermoCliente(e.target.value)} placeholder="(67) 98765-4321" className="flex-1 border rounded-lg px-3 py-2" />
                    <button type="button" onClick={buscarCliente} className="bg-gray-200 px-3 py-2 rounded-lg hover:bg-gray-300">Buscar</button>
                  </div>
                  {clienteEncontrado && <p className="text-sm text-green-600 mt-1">✓ {clienteEncontrado.nome}</p>}
                </div>
                {dependentes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Dependente (opcional)</label>
                    <select value={dependenteId} onChange={e => setDependenteId(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                      <option value="">— Sem dependente —</option>
                      {dependentes.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Serviço</label>
                  <select value={servicoId} onChange={e => setServicoId(e.target.value)} required className="w-full border rounded-lg px-3 py-2">
                    <option value="">Selecione...</option>
                    {servicos.map(s => <option key={s.id} value={s.id}>{s.nome} - R$ {Number(s.preco).toFixed(2)}</option>)}
                  </select>
                </div>
                {slotsDisponiveis.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Horário</label>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                      {slotsDisponiveis.map(s => (
                        <button key={s.hora} type="button" onClick={() => setHoraEscolhida(s.hora)}
                          className={`px-3 py-2 rounded-lg text-sm ${horaEscolhida === s.hora ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                          {s.hora}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={!clienteEncontrado || !servicoId || !horaEscolhida} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex-1">Confirmar</button>
                  <button type="button" onClick={() => setShowNovo(false)} className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="divide-y">
            {slots.length === 0 && <div className="p-6 text-center text-gray-400">Nenhum horário configurado para este dia</div>}
            {slots.map((hora) => {
              const ag = agendamentos.find(a => formatTime(a.hora_inicio) === hora)
              return (
                <div key={hora} className="flex items-center hover:bg-gray-50 group">
                  <div className="w-20 px-4 py-3 text-sm text-gray-500 font-medium border-r">{hora}</div>
                  <div className="flex-1 px-4 py-3">
                    {ag ? (
                      <div className={`p-2 rounded-lg ${ag.status === 'concluido' ? 'bg-green-50' : ag.status === 'cancelado' ? 'bg-red-50' : ag.status === 'em_atendimento' ? 'bg-yellow-50' : 'bg-blue-50'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{ag.dependente_nome || ag.titular_nome}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${ag.status === 'concluido' ? 'bg-green-200 text-green-800' : ag.status === 'cancelado' ? 'bg-red-200 text-red-800' : ag.status === 'em_atendimento' ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-200 text-blue-800'}`}>
                            {ag.status === 'em_atendimento' ? 'em atendimento' : ag.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{ag.servico_nome} - R$ {Number(ag.preco_servico || ag.preco_padrao || 0).toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{formatTime(ag.hora_inicio)} - {formatTime(ag.hora_fim)}</p>
                        <div className="flex gap-1 mt-1">
                          {ag.status === 'agendado' && (
                            <><button onClick={() => iniciar(ag.id)} className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded hover:bg-yellow-600 flex items-center gap-1"><Play size={10} /> Iniciar</button>
                              <button onClick={() => cancelar(ag.id)} className="text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600 flex items-center gap-1"><X size={10} /> Cancelar</button></>
                          )}
                          {ag.status === 'em_atendimento' && (
                            <button onClick={() => concluir(ag.id)} className="text-xs bg-green-600 text-white px-2 py-0.5 rounded hover:bg-green-700 flex items-center gap-1"><Check size={10} /> Concluir</button>
                          )}
                        </div>
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
