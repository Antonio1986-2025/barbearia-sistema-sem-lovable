import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { comandasAPI, barbeirosAPI } from '../services/api'
import { Search, Plus, DollarSign } from 'lucide-react'

export default function TelaCaixa() {
  const [comandasAbertas, setComandasAbertas] = useState([])
  const [comandaSelecionada, setComandaSelecionada] = useState(null)
  const [itens, setItens] = useState([])
  const [termoBusca, setTermoBusca] = useState('')
  const [novoItem, setNovoItem] = useState({ tipo: 'produto', descricao: '', valor: '' })
  const [formaPagamento, setFormaPagamento] = useState('dinheiro')

  useEffect(() => {
    carregarComandas()
  }, [])

  const carregarComandas = async () => {
    try {
      const r = await comandasAPI.listarAbertas()
      setComandasAbertas(r.data)
    } catch (err) {}
  }

  const selecionarComanda = async (comanda) => {
    setComandaSelecionada(comanda)
    try {
      const r = await comandasAPI.buscar(comanda.id)
      setItens(r.data.itens || [])
    } catch (err) {}
  }

  const adicionarItem = async () => {
    if (!novoItem.descricao || !novoItem.valor) return
    try {
      await comandasAPI.adicionarItem(comandaSelecionada.id, novoItem)
      const r = await comandasAPI.buscar(comandaSelecionada.id)
      setItens(r.data.itens || [])
      setComandaSelecionada(r.data)
      setNovoItem({ tipo: 'produto', descricao: '', valor: '' })
    } catch (err) { alert('Erro ao adicionar item') }
  }

  const pagar = async () => {
    try {
      await comandasAPI.pagar(comandaSelecionada.id, formaPagamento)
      alert('Comanda paga com sucesso!')
      setComandaSelecionada(null)
      setItens([])
      carregarComandas()
    } catch (err) { alert('Erro ao pagar') }
  }

  const comandasFiltradas = comandasAbertas.filter(c =>
    c.cliente_nome?.toLowerCase().includes(termoBusca.toLowerCase()) ||
    c.titular_nome?.toLowerCase().includes(termoBusca.toLowerCase())
  )

  const total = itens.reduce((acc, item) => acc + Number(item.valor) * (item.quantidade || 1), 0)

  return (
    <div>
      <Header title="Caixa / PDV" />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Comandas Abertas</h2>
            <div className="relative mb-4">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input type="text" placeholder="Buscar cliente..." value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {comandasFiltradas.map((c) => (
                <button key={c.id} onClick={() => selecionarComanda(c)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${comandaSelecionada?.id === c.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}>
                  <p className="font-medium">{c.cliente_nome}</p>
                  <p className="text-xs text-gray-500">{c.titular_nome && `Titular: ${c.titular_nome}`}</p>
                  <p className="text-xs text-gray-400">{new Date(c.data_abertura).toLocaleString()}</p>
                </button>
              ))}
              {comandasFiltradas.length === 0 && <p className="text-gray-400 text-sm">Nenhuma comanda aberta</p>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {comandaSelecionada ? (
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">{comandaSelecionada.cliente_nome}</h2>
                  <p className="text-sm text-gray-500">{comandaSelecionada.titular_nome && `Titular: ${comandaSelecionada.titular_nome}`}</p>
                </div>
                <span className="text-2xl font-bold text-blue-600">R$ {total.toFixed(2)}</span>
              </div>

              <div className="space-y-2 mb-6">
                {itens.map((item, i) => (
                  <div key={item.id || i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.descricao}</p>
                      <p className="text-xs text-gray-500 capitalize">{item.tipo}</p>
                    </div>
                    <p className="font-medium">R$ {Number(item.valor).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mb-6">
                <h3 className="font-medium mb-3">Adicionar Item</h3>
                <div className="flex gap-2 mb-2">
                  <select value={novoItem.tipo} onChange={(e) => setNovoItem({ ...novoItem, tipo: e.target.value })} className="border rounded-lg px-3 py-2">
                    <option value="produto">Produto</option>
                    <option value="servico">Serviço</option>
                  </select>
                  <input type="text" placeholder="Descrição" value={novoItem.descricao}
                    onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })} className="flex-1 border rounded-lg px-3 py-2" />
                  <input type="number" step="0.01" placeholder="Valor" value={novoItem.valor}
                    onChange={(e) => setNovoItem({ ...novoItem, valor: e.target.value })} className="w-24 border rounded-lg px-3 py-2" />
                  <button onClick={adicionarItem} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Forma de Pagamento</h3>
                <div className="flex gap-2 mb-4">
                  {['dinheiro', 'pix', 'debito', 'credito'].map((f) => (
                    <button key={f} onClick={() => setFormaPagamento(f)}
                      className={`px-4 py-2 rounded-lg capitalize ${formaPagamento === f ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                      {f}
                    </button>
                  ))}
                </div>
                <button onClick={pagar} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2">
                  <DollarSign size={20} /> Confirmar Pagamento - R$ {total.toFixed(2)}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-sm border flex items-center justify-center h-64">
              <p className="text-gray-400 text-lg">Selecione uma comanda ao lado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
