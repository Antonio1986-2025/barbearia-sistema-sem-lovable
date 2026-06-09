const express = require('express');
const router = express.Router();
const agendamentos = require('../models/agendamentos');
const barbeiros = require('../models/barbeiros');
const comandas = require('../models/comandas');
const servicos = require('../models/servicos');

router.post('/', async (req, res) => {
  try {
    const { usuarioTitularId, dependenteId, barbeiroId, servicoId, data, horaInicio, observacoes } = req.body;
    const servico = await servicos.buscarPorId(servicoId);
    if (!servico) return res.status(404).json({ error: 'Serviço não encontrado' });

    const [h, m] = horaInicio.split(':').map(Number);
    const minutosFim = h * 60 + m + servico.duracao_minutos;
    const horaFim = `${String(Math.floor(minutosFim / 60)).padStart(2, '0')}:${String(minutosFim % 60).padStart(2, '0')}`;

    const agendamento = await agendamentos.criar({
      usuarioTitularId, dependenteId, barbeiroId, servicoId,
      data, horaInicio, horaFim,
      duracaoMinutos: servico.duracao_minutos,
      precoServico: servico.preco,
      observacoes
    });

    const comanda = await comandas.criar(
      agendamento.id,
      dependenteId ? (await require('../models/usuarios').buscarPorId(dependenteId))?.nome : 'Cliente',
      (await require('../models/usuarios').buscarPorId(usuarioTitularId))?.nome
    );

    const io = req.app.get('io');
    io.to(`barbeiro_${barbeiroId}`).emit('novo_agendamento', {
      agendamento_id: agendamento.id,
      cliente_nome: comanda.cliente_nome,
      servico_nome: servico.nome,
      data_hora: `${data}T${horaInicio}:00`
    });

    res.status(201).json({
      success: true,
      agendamento,
      comanda,
      mensagem: `Agendamento confirmado para ${comanda.cliente_nome}`
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
