const express = require('express');
const router = express.Router();
const comissoes = require('../models/comissoes');

router.get('/barbeiro/:barbeiroId', async (req, res) => {
  try {
    const lista = await comissoes.listarPorBarbeiro(req.params.barbeiroId);
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/barbeiro/:barbeiroId/resumo', async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    const result = await comissoes.resumoSemana(req.params.barbeiroId, dataInicio, dataFim);
    res.json({ resumo: { ...result }, historico: result.historico });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vales', async (req, res) => {
  try {
    const { barbeiroId, valor, observacoes } = req.body;
    const barbeiro = await require('../models/barbeiros').buscarPorId(barbeiroId);
    if (!barbeiro) return res.status(404).json({ error: 'Barbeiro não encontrado' });

    const valesAbertos = await comissoes.listarVales(barbeiroId);
    const totalVales = valesAbertos.filter(v => v.status === 'aberto').reduce((sum, v) => sum + Number(v.valor), 0);

    if (totalVales + valor > Number(barbeiro.limite_vale)) {
      return res.status(400).json({ error: `Limite de vale excedido. Limite: R$ ${barbeiro.limite_vale}, já utilizado: R$ ${totalVales}` });
    }

    const vale = await comissoes.registrarVale(barbeiroId, valor, observacoes);
    res.status(201).json({
      success: true,
      vale,
      mensagem: `Vale de R$ ${valor.toFixed(2)} registrado`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vales/barbeiro/:barbeiroId', async (req, res) => {
  try {
    const vales = await comissoes.listarVales(req.params.barbeiroId);
    res.json(vales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vales/:id/descontar', async (req, res) => {
  try {
    const vale = await comissoes.descontaVale(req.params.id);
    if (!vale) return res.status(404).json({ error: 'Vale não encontrado' });
    res.json({ success: true, vale });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/pagar', async (req, res) => {
  try {
    const comissao = await comissoes.pagarComissao(req.params.id);
    if (!comissao) return res.status(404).json({ error: 'Comissão não encontrada' });
    res.json({ success: true, comissao, mensagem: 'Comissão paga com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pagar-semana', async (req, res) => {
  try {
    const { barbeiroId, dataInicio, dataFim } = req.body;
    const pagas = await comissoes.pagarTodasSemana(barbeiroId, dataInicio, dataFim);
    res.json({ success: true, pagas: pagas.length, mensagem: `${pagas.length} comissões pagas` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
