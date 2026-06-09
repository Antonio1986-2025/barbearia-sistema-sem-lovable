const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/faturamento', async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    const result = await db.query(
      `SELECT DATE(data_movimento) AS data, SUM(valor) AS total
       FROM movimentacoes WHERE tipo = 'entrada'
       AND data_movimento BETWEEN $1 AND $2
       GROUP BY DATE(data_movimento) ORDER BY data`,
      [dataInicio || '2024-01-01', dataFim || new Date().toISOString().split('T')[0]]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/desempenho-barbeiros', async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    const result = await db.query(
      `SELECT b.nome, COUNT(a.id) AS total_atendimentos,
              COALESCE(SUM(s.preco), 0) AS total_produzido
       FROM agendamentos a
       JOIN barbeiros b ON b.id = a.barbeiro_id
       JOIN servicos s ON s.id = a.servico_id
       WHERE a.status = 'concluido'
       AND a.data BETWEEN $1 AND $2
       GROUP BY b.nome ORDER BY total_produzido DESC`,
      [dataInicio || '2024-01-01', dataFim || new Date().toISOString().split('T')[0]]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/servicos-mais-vendidos', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.nome, COUNT(a.id) AS total_vendas, SUM(s.preco) AS total_faturado
       FROM agendamentos a JOIN servicos s ON s.id = a.servico_id
       WHERE a.status = 'concluido'
       GROUP BY s.nome ORDER BY total_vendas DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/clientes-fieis', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.nome, u.telefone, COUNT(a.id) AS total_visitas
       FROM agendamentos a JOIN usuarios u ON u.id = a.usuario_titular_id
       WHERE a.status = 'concluido'
       GROUP BY u.nome, u.telefone ORDER BY total_visitas DESC LIMIT 10`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/resumo', async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const faturamentoHoje = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM movimentacoes WHERE tipo = 'entrada' AND DATE(data_movimento) = $1`,
      [hoje]
    );
    const agendamentosHoje = await db.query(
      `SELECT COUNT(*) AS total FROM agendamentos WHERE data = $1 AND status != 'cancelado'`,
      [hoje]
    );
    const comandasAbertas = await db.query(
      `SELECT COUNT(*) AS total FROM comandas WHERE status = 'aberta'`
    );
    const comissoesPendentes = await db.query(
      `SELECT COALESCE(SUM(valor_comissao), 0) AS total FROM comissoes WHERE status = 'pendente'`
    );
    res.json({
      faturamentoHoje: faturamentoHoje.rows[0].total,
      agendamentosHoje: agendamentosHoje.rows[0].total,
      comandasAbertas: comandasAbertas.rows[0].total,
      comissoesPendentes: comissoesPendentes.rows[0].total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
