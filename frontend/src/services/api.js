import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export const agendamentosAPI = {
  criar: (data) => api.post('/agendamentos', data),
  listarPorBarbeiro: (id, data) => api.get(`/agendamentos/barbeiro/${id}`, { params: { data } }),
  horariosDisponiveis: (barbeiroId, servicoId, data) =>
    api.get(`/agendamentos/horarios-disponiveis/${barbeiroId}/${servicoId}/${data}`),
  cancelar: (id, motivo) => api.post(`/agendamentos/${id}/cancelar`, { motivo }),
  concluir: (id) => api.put(`/agendamentos/${id}/concluir`),
  iniciar: (id) => api.put(`/agendamentos/${id}/iniciar`),
}

export const barbeirosAPI = {
  listar: () => api.get('/barbeiros'),
  buscar: (id) => api.get(`/barbeiros/${id}`),
  especialidades: (id) => api.get(`/barbeiros/${id}/especialidades`),
  horarios: (id) => api.get(`/barbeiros/${id}/horarios`),
  criar: (data) => api.post('/barbeiros', data),
  ativarNoturno: (id, data) => api.post(`/barbeiros/${id}/noturno/ativar`, { data }),
  desativarNoturno: (id, data) => api.post(`/barbeiros/${id}/noturno/desativar`, { data }),
}

export const comandasAPI = {
  listarAbertas: () => api.get('/comandas/abertas'),
  buscar: (id) => api.get(`/comandas/${id}`),
  buscarPorCliente: (nome, data) => api.get(`/comandas/buscar/${nome}`, { params: { data } }),
  adicionarItem: (id, data) => api.post(`/comandas/${id}/itens`, data),
  pagar: (id, valorPago, formaPagamento) => api.post(`/comandas/${id}/pagar`, { valorPago, formaPagamento }),
  criarAvulsa: (data) => api.post('/comandas/avulsa', data),
}

export const comissoesAPI = {
  listar: (barbeiroId) => api.get(`/comissoes/barbeiro/${barbeiroId}`),
  resumo: (barbeiroId, params) => api.get(`/comissoes/barbeiro/${barbeiroId}/resumo`, { params }),
  registrarVale: (data) => api.post('/comissoes/vales', data),
  vales: (barbeiroId) => api.get(`/comissoes/vales/barbeiro/${barbeiroId}`),
  descontarVale: (id) => api.post(`/comissoes/vales/${id}/descontar`),
  pagarSemana: (data) => api.post('/comissoes/pagar-semana', data),
  pagar: (id) => api.post(`/comissoes/${id}/pagar`),
}

export const acertosAPI = {
  pendentes: () => api.get('/acertos/pendentes'),
  listar: (barbeiroId) => api.get(`/acertos/barbeiro/${barbeiroId}`),
  criar: (data) => api.post('/acertos', data),
  pagar: (id, valorPago, adminId) => api.post(`/acertos/${id}/pagar`, { valorPago, adminId }),
}

export const usuariosAPI = {
  listar: () => api.get('/usuarios'),
  criar: (data) => api.post('/usuarios', data),
  buscarTelefone: (telefone) => api.get(`/usuarios/telefone/${telefone}`),
  buscar: (id) => api.get(`/usuarios/${id}`),
  criarDependente: (data) => api.post('/usuarios/dependentes', data),
}

export const servicosAPI = {
  listar: () => api.get('/servicos'),
}

export const relatoriosAPI = {
  resumo: () => api.get('/relatorios/resumo'),
  dashboardHoje: () => api.get('/relatorios/dashboard/hoje'),
  financeiro: (dataInicio, dataFim) => api.get(`/relatorios/financeiro/${dataInicio}/${dataFim}`),
  faturamento: (params) => api.get('/relatorios/faturamento', { params }),
  desempenho: (params) => api.get('/relatorios/desempenho-barbeiros', { params }),
  servicosMaisVendidos: () => api.get('/relatorios/servicos-mais-vendidos'),
  clientesFieis: () => api.get('/relatorios/clientes-fieis'),
}

export default api
