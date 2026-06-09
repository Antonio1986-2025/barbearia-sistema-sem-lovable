const express = require('express');
const router = express.Router();
const agendamentos = require('../models/agendamentos');
const barbeiros = require('../models/barbeiros');
const comandas = require('../models/comandas');

router.post('/', async (req, res) => {
  try {
    const { usuarioTitularId, dependenteId, barbeiroId, servicoId, data, horaInicio } = req.body;
    const servico = await require('../models/servicos').buscarPorId(servicoId);
    if (!servico) return res.status(404).json({ error: 'Servico nao encontrado' });

    const [h, m] = horaInicio.split(':').map(Number);
    const minutosFim = h * 60 + m + servico.duracao_minutos;
    const horaFim = `${String(Math.floor(minutosFim / 60)).padStart(2, '0')}:${String(minutosFim % 60).padStart(2, '0')}`;

    const disponivel = await barbeiros.verificarDisponibilidade(barbeiroId, data, horaInicio, horaFim);
    if (!disponivel) return res.status(409).json({ error: 'Horario indisponivel' });

    const agendamento = await agendamentos.criar({ usuarioTitularId, dependenteId, barbeiroId, servicoId, data, horaInicio, horaFim });

    const barbeiro = await barbeiros.buscarPorId(barbeiroId);
    const io = req.app.get('io');
    io.to(`barbeiro_${barbeiroId}`).emit('novo_agendamento', { agendamento, barbeiroNome: barbeiro.nome });

    res.status(201).json(agendamento);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/disponiveis', async (req, res) => {
  try {
    const { barbeiroId, data, servicoId } = req.query;
    const slots = await agendamentos.buscarHorariosDisponiveis(barbeiroId, data, servicoId);
    res.json(slots);
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

router.put('/:id/cancelar', async (req, res) => {
  try {
    const agendamento = await agendamentos.cancelar(req.params.id);
    if (!agendamento) return res.status(404).json({ error: 'Agendamento nao encontrado ou ja cancelado' });
    res.json(agendamento);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/concluir', async (req, res) => {
  try {
    const agendamento = await agendamentos.concluir(req.params.id);
    if (!agendamento) return res.status(404).json({ error: 'Agendamento nao encontrado' });
    res.json(agendamento);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
