const express = require('express');
const router = express.Router();
const comandas = require('../models/comandas');
const comissoes = require('../models/comissoes');
const agendamentos = require('../models/agendamentos');
const barbeiros = require('../models/barbeiros');

router.get('/abertas', async (req, res) => {
  try {
    const lista = await comandas.listarAbertas();
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const comanda = await comandas.buscarPorId(req.params.id);
    if (!comanda) return res.status(404).json({ error: 'Comanda nao encontrada' });
    const itens = await comandas.listarItens(req.params.id);
    res.json({ ...comanda, itens });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/itens', async (req, res) => {
  try {
    const { tipo, descricao, valor, quantidade } = req.body;
    const item = await comandas.adicionarItem(req.params.id, tipo, descricao, valor, quantidade);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/pagar', async (req, res) => {
  try {
    const { formaPagamento } = req.body;
    const comanda = await comandas.pagar(req.params.id, formaPagamento);
    if (!comanda) return res.status(404).json({ error: 'Comanda nao encontrada' });

    const agendamento = await agendamentos.concluir(comanda.agendamento_id);
    if (agendamento) {
      const servico = await require('../models/servicos').buscarPorId(agendamento.servico_id);
      const comissao = await comissoes.gerar(agendamento.barbeiro_id, agendamento.id, comanda.id, servico.preco);

      const barbeiro = await barbeiros.buscarPorId(agendamento.barbeiro_id);
      const io = req.app.get('io');
      io.to(`barbeiro_${agendamento.barbeiro_id}`).emit('comissao_atualizada', {
        comissao, barbeiroNome: barbeiro.nome
      });
    }

    res.json(comanda);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
