const express = require('express');
const router = express.Router();
const acertos = require('../models/acertos');

router.get('/pendentes', async (req, res) => {
  try {
    const lista = await acertos.listarPendentes();
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/barbeiro/:barbeiroId', async (req, res) => {
  try {
    const lista = await acertos.listarPorBarbeiro(req.params.barbeiroId);
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { barbeiroId, semanaInicio, semanaFim } = req.body;
    const acerto = await acertos.criar({ barbeiroId, semanaInicio, semanaFim });
    res.status(201).json({ success: true, acerto });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/pagar', async (req, res) => {
  try {
    const { valorPago, adminId } = req.body;
    const acerto = await acertos.pagar(req.params.id, valorPago, adminId);
    if (!acerto) return res.status(404).json({ error: 'Acerto não encontrado' });
    res.json({ success: true, acerto, mensagem: `Pagamento de R$ ${valorPago.toFixed(2)} registrado` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
