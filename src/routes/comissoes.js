const express = require('express');
const router = express.Router();
const comissoes = require('../models/comissoes');

router.get('/barbeiro/:id', async (req, res) => {
  try {
    const lista = await comissoes.listarPorBarbeiro(req.params.id);
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/barbeiro/:id/resumo', async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    const resumo = await comissoes.resumoSemana(req.params.id, dataInicio, dataFim);
    res.json(resumo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vales', async (req, res) => {
  try {
    const { barbeiroId, valor, descricao } = req.body;
    const vale = await comissoes.registrarVale(barbeiroId, valor, descricao);
    res.status(201).json(vale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vales/barbeiro/:id', async (req, res) => {
  try {
    const vales = await comissoes.listarVales(req.params.id);
    res.json(vales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/pagar', async (req, res) => {
  try {
    const comissao = await comissoes.pagarComissao(req.params.id);
    res.json(comissao);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pagar-semana', async (req, res) => {
  try {
    const { barbeiroId, dataInicio, dataFim } = req.body;
    const pagas = await comissoes.pagarTodasSemana(barbeiroId, dataInicio, dataFim);
    res.json({ pagas: pagas.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
