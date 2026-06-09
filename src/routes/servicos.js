const express = require('express');
const router = express.Router();
const servicos = require('../models/servicos');

router.get('/', async (req, res) => {
  try {
    const lista = await servicos.listarTodos();
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const servico = await servicos.buscarPorId(req.params.id);
    if (!servico) return res.status(404).json({ error: 'Servico nao encontrado' });
    res.json(servico);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const servico = await servicos.criar(req.body);
    res.status(201).json(servico);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const servico = await servicos.atualizar(req.params.id, req.body);
    res.json(servico);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
