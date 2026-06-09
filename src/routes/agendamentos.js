const express = require('express');
const router = express.Router();
const agendamentos = require('../models/agendamentos');
const barbeiros = require('../models/barbeiros');
const comandas = require('../models/comandas');
const comissoes = require('../models/comissoes');
const servicos = require('../models/servicos');
const usuarios = require('../models/usuarios');
const db = require('../config/database');

router.post('/', async (req, res) => {
  try {
    const { usuarioTitularId, dependenteId, barbeiroId, servicoId, data, horaInicio, observacoes } = req.body;
    const servico = await servicos.buscarPorId(servicoId);
    if (!servico) return res.status(404).json({ error: 'Serviço não encontrado' });

    const [h, m] = horaInicio.split(':').map(Number);
    const minutosInicio = h * 60 + m;
    const minutosFim = minutosInicio + servico.duracao_minutos;
    const horaFim = `${String(Math.floor(minutosFim / 60)).padStart(2, '0')}:${String(minutosFim % 60).padStart(2, '0')}`;

    const disponivel = await agendamentos.verificarDisponibilidade(barbeiroId, data, horaInicio, horaFim);
    if (!disponivel) return res.status(409).json({ error: 'Horário não disponível' });

    const specs = await barbeiros.buscarEspecialidades(barbeiroId);
    const spec = specs.find(s => s.id === servicoId);
    const precoServico = spec?.preco_customizado ? Number(spec.preco_customizado) : Number(servico.preco);

    const agendamento = await agendamentos.criar({
      usuarioTitularId, dependenteId, barbeiroId, servicoId,
      data, horaInicio, horaFim,
      duracaoMinutos: servico.duracao_minutos,
      precoServico,
      observacoes
    });

    let clienteNome = 'Cliente';
    let titularNome = null;
    const titular = await usuarios.buscarPorId(usuarioTitularId);
    if (titular) titularNome = titular.nome;
    if (dependenteId) {
      const dep = await db.query(`SELECT nome FROM dependentes WHERE id = $1`, [dependenteId]);
      if (dep.rows[0]) clienteNome = dep.rows[0].nome;
    } else if (titular) {
      clienteNome = titular.nome;
    }

    const comanda = await comandas.criar(agendamento.id, clienteNome, titularNome);

    const io = req.app.get('io');
    io.to(`barbeiro_${barbeiroId}`).emit('novo_agendamento', {
      agendamento_id: agendamento.id,
      cliente_nome: clienteNome,
      servico_nome: servico.nome,
      data_hora: `${data}T${horaInicio}:00`
    });

    res.status(201).json({
      success: true,
      agendamento,
      comanda,
      mensagem: `Agendamento confirmado para ${clienteNome}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/horarios-disponiveis/:barbeiroId/:servicoId/:data', async (req, res) => {
  try {
    const { barbeiroId, servicoId, data } = req.params;
    const slots = await agendamentos.buscarHorariosDisponiveis(barbeiroId, servicoId, data);
    res.json({ data, total_horarios: slots.length, horarios: slots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/barbeiro/:id', async (req, res) => {
  try {
    const { data } = req.query;
    const lista = await agendamentos.listarPorBarbeiro(req.params.id, data);
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/cancelar', async (req, res) => {
  try {
    const { motivo } = req.body;
    const agendamento = await agendamentos.cancelar(req.params.id, motivo);
    if (!agendamento) return res.status(404).json({ error: 'Agendamento não encontrado ou já cancelado' });
    res.json({ success: true, agendamento, mensagem: 'Agendamento cancelado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/concluir', async (req, res) => {
  try {
    const agendamento = await agendamentos.concluir(req.params.id);
    if (!agendamento) return res.status(404).json({ error: 'Agendamento não encontrado' });

    const comanda = await comandas.buscarPorAgendamento(agendamento.id);
    if (comanda) {
      await comissoes.gerar(agendamento.barbeiro_id, agendamento.id, comanda.id, agendamento.preco_servico);
    }

    const io = req.app.get('io');
    io.to(`barbeiro_${agendamento.barbeiro_id}`).emit('comissao_atualizada', {
      agendamento_id: agendamento.id,
      barbeiro_id: agendamento.barbeiro_id
    });

    res.json(agendamento);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/iniciar', async (req, res) => {
  try {
    const agendamento = await agendamentos.iniciarAtendimento(req.params.id);
    if (!agendamento) return res.status(404).json({ error: 'Agendamento não encontrado' });
    res.json(agendamento);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
