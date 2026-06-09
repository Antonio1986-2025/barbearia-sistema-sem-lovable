import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { comissoesAPI, barbeirosAPI } from '../services/api'

export default function ComissoesPage() {
  const [barbeiros, setBarbeiros] = useState([])
  const [barbeiroId, setBarbeiroId] = useState('')
  const [comissoes, setComissoes] = useState([])
  const [vales, setVales] = useState([])
  const [novoVale, setNovoVale] = useState({ valor: '', descricao: '' })

  useEffect(() => {
    barbeirosAPI.listar().then(r => {
      setBarbeiros(r.data)
      if (r.data.length > 0) setBarbeiroId(r.data[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (barbeiroId) {
      comissoesAPI.listar(barbeiroId).then(r => setComissoes(r.data)).catch(() => {})
      comissoesAPI.vales(barbeiroId).then(r => setVales(r.data)).catch(() => {})
    }
  }, [barbeiroId])

  const registrarVale = async (e) => {
    e.preventDefault()
    try {
      await comissoesAPI.registrarVale({ barbeiroId, valor: parseFloat(novoVale.valor), descricao: novoVale.descricao })
      setNovoVale({ valor: '', descricao: '' })
      const r = await comissoesAPI.vales(barbeiroId)
      setVales(r.data)
    } catch (err) { alert('Erro ao registrar vale') }
  }

  const pagarSemana = async () => {
    const hoje = new Date()
    const segunda = new Date(hoje); segunda.setDate(hoje.getDate() - ((hoje.getDay() + 6) % 7))
    const domingo = new Date(segunda); domingo.setDate(segunda.getDate() + 6)
    const fmt = (d) => d.toISOString().split('T')[0]
    try {
      await comissoesAPI.pagarSemana({ barbeiroId, dataInicio: fmt(segunda), dataFim: fmt(domingo) })
      alert('Comissões pagas!')
      const r = await comissoesAPI.listar(barbeiroId)
      setComissoes(r.data)
    } catch (err) { alert('Erro ao pagar') }
  }

  return (
    <div>
      <Header title="Comissões" />
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <select value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)} className="border rounded-lg px-4 py-2">
            {barbeiros.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
          </select>
          <button onClick={pagarSemana} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Pagar Comissões da Semana
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Registrar Vale</h2>
            <form onSubmit={registrarVale} className="space-y-3">
              <input type="number" step="0.01" placeholder="Valor do vale" value={novoVale.valor}
                onChange={(e) => setNovoVale({ ...novoVale, valor: e.target.value })}
                className="w-full border rounded-lg px-4 py-2" required />
              <input type="text" placeholder="Descrição (opcional)" value={novoVale.descricao}
                onChange={(e) => setNovoVale({ ...novoVale, descricao: e.target.value })}
                className="w-full border rounded-lg px-4 py-2" />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Registrar Vale
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Histórico de Vales</h2>
            <div className="space-y-2">
              {vales.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">R$ {Number(v.valor).toFixed(2)}</p>
                    {v.descricao && <p className="text-xs text-gray-500">{v.descricao}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${v.status === 'aberto' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {v.status}
                  </span>
                </div>
              ))}
              {vales.length === 0 && <p className="text-gray-400 text-sm">Nenhum vale registrado</p>}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Comissões</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-gray-500">Data</th>
                  <th className="pb-3 font-medium text-gray-500">Valor Serviço</th>
                  <th className="pb-3 font-medium text-gray-500">Comissão</th>
                  <th className="pb-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {comissoes.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-3">{new Date(c.data_geracao).toLocaleDateString()}</td>
                    <td className="py-3">R$ {Number(c.valor_servico).toFixed(2)}</td>
                    <td className="py-3 font-medium">{c.percentual_comissao}% — R$ {Number(c.valor_comissao).toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${c.status === 'paga' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {comissoes.length === 0 && <tr><td colSpan={4} className="py-3 text-gray-400 text-center">Nenhuma comissão</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
