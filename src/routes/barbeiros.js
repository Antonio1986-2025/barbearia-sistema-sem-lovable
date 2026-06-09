const express = require('express');
const router = express.Router();
const barbeiros = require('../models/barbeiros');

router.get('/', async (req, res) => {
  try {
    const lista = await barbeiros.listarTodos();
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const barbeiro = await barbeiros.buscarPorId(req.params.id);
    if (!barbeiro) return res.status(404).json({ error: 'Barbeiro nao encontrado' });
    res.json(barbeiro);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/especialidades', async (req, res) => {
  try {
    const especialidades = await barbeiros.buscarEspecialidades(req.params.id);
    res.json(especialidades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/horarios', async (req, res) => {
  try {
    const horarios = await barbeiros.buscarHorarios(req.params.id);
    res.json(horarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const barbeiro = await barbeiros.criar(req.body);
    res.status(201).json(barbeiro);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/noturno', async (req, res) => {
  try {
    const { data, ativo } = req.body;
    await barbeiros.ativarNoturno(req.params.id, data, ativo);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
