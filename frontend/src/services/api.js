import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
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
  horariosDisponiveis: (params) => api.get('/agendamentos/disponiveis', { params }),
  cancelar: (id) => api.put(`/agendamentos/${id}/cancelar`),
}

export const barbeirosAPI = {
  listar: () => api.get('/barbeiros'),
  buscar: (id) => api.get(`/barbeiros/${id}`),
  especialidades: (id) => api.get(`/barbeiros/${id}/especialidades`),
  horarios: (id) => api.get(`/barbeiros/${id}/horarios`),
  ativarNoturno: (id, data, ativo) => api.post(`/barbeiros/${id}/noturno`, { data, ativo }),
}

export const comandasAPI = {
  listarAbertas: () => api.get('/comandas/abertas'),
  buscar: (id) => api.get(`/comandas/${id}`),
  adicionarItem: (id, data) => api.post(`/comandas/${id}/itens`, data),
  pagar: (id, formaPagamento) => api.post(`/comandas/${id}/pagar`, { formaPagamento }),
}

export const comissoesAPI = {
  listar: (barbeiroId) => api.get(`/comissoes/barbeiro/${barbeiroId}`),
  resumo: (barbeiroId, params) => api.get(`/comissoes/barbeiro/${barbeiroId}/resumo`, { params }),
  registrarVale: (data) => api.post('/comissoes/vales', data),
  vales: (barbeiroId) => api.get(`/comissoes/vales/barbeiro/${barbeiroId}`),
  pagarSemana: (data) => api.post('/comissoes/pagar-semana', data),
}

export const usuariosAPI = {
  criar: (data) => api.post('/usuarios', data),
  buscarTelefone: (telefone) => api.get(`/usuarios/telefone/${telefone}`),
  criarDependente: (data) => api.post('/usuarios/dependentes', data),
}

export const servicosAPI = {
  listar: () => api.get('/servicos'),
}

export const relatoriosAPI = {
  resumo: () => api.get('/relatorios/resumo'),
  faturamento: (params) => api.get('/relatorios/faturamento', { params }),
  desempenho: (params) => api.get('/relatorios/desempenho-barbeiros', { params }),
  servicosMaisVendidos: () => api.get('/relatorios/servicos-mais-vendidos'),
  clientesFieis: () => api.get('/relatorios/clientes-fieis'),
}

export default api
