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

router.get('/buscar/:clienteNome', async (req, res) => {
  try {
    const { data } = req.query;
    let query = `SELECT c.* FROM comandas c WHERE c.cliente_nome ILIKE $1 AND c.status = 'aberta'`;
    const params = [`%${req.params.clienteNome}%`];
    if (data) {
      query += ` AND c.data_abertura::date = $2`;
      params.push(data);
    }
    query += ` ORDER BY c.data_abertura DESC LIMIT 1`;
    const result = await require('../config/database').query(query, params);
    if (!result.rows[0]) return res.status(404).json({ error: 'Comanda não encontrada' });

    const comanda = result.rows[0];
    const itens = await comandas.listarItens(comanda.id);
    res.json({ comanda, itens });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const comanda = await comandas.buscarPorId(req.params.id);
    if (!comanda) return res.status(404).json({ error: 'Comanda não encontrada' });
    const itens = await comandas.listarItens(req.params.id);
    res.json({ comanda, itens });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/itens', async (req, res) => {
  try {
    const { tipo, descricao, valor, quantidade } = req.body;
    const item = await comandas.adicionarItem(req.params.id, tipo, descricao, valor, quantidade);
    res.status(201).json({ success: true, item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/pagar', async (req, res) => {
  try {
    const { valorPago, formaPagamento } = req.body;
    const comanda = await comandas.pagar(req.params.id, formaPagamento);
    if (!comanda) return res.status(404).json({ error: 'Comanda não encontrada' });

    const ag = await agendamentos.concluir(comanda.agendamento_id);
    if (ag) {
      const servico = await require('../models/servicos').buscarPorId(ag.servico_id);
      await comissoes.gerar(ag.barbeiro_id, ag.id, comanda.id, ag.preco_servico);

      const io = req.app.get('io');
      io.to(`barbeiro_${ag.barbeiro_id}`).emit('comissao_atualizada', {
        comanda_id: comanda.id,
        barbeiro_id: ag.barbeiro_id
      });
    }

    await require('../config/database').query(
      `INSERT INTO movimentacoes (tipo, descricao, valor, categoria, comanda_id, barbeiro_id)
       VALUES ('entrada', $1, $2, $3, $4, $5)`,
      [`Pagamento - ${comanda.cliente_nome}`, comanda.total, 'venda_servico', comanda.id, ag?.barbeiro_id]
    );

    res.json({
      success: true,
      comanda,
      mensagem: `Pagamento de R$ ${Number(comanda.total).toFixed(2)} registrado!`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
