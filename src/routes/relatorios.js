const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/dashboard/hoje', async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const agendamentos = await db.query(
      `SELECT COUNT(*) AS total FROM agendamentos WHERE data = $1 AND status != 'cancelado'`, [hoje]
    );
    const faturamento = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM movimentacoes WHERE tipo = 'entrada' AND DATE(data_movimento) = $1`, [hoje]
    );
    const comissoes = await db.query(
      `SELECT COALESCE(SUM(valor_comissao), 0) AS total FROM comissoes WHERE DATE(data_geracao) = $1`, [hoje]
    );
    const clientes = await db.query(
      `SELECT COUNT(DISTINCT usuario_titular_id) AS total FROM agendamentos WHERE data = $1 AND status != 'cancelado'`, [hoje]
    );

    res.json({
      data: hoje,
      resumo: {
        agendamentos_total: parseInt(agendamentos.rows[0].total),
        faturamento_total: parseFloat(faturamento.rows[0].total),
        comissoes_geradas: parseFloat(comissoes.rows[0].total),
        clientes_atendidos: parseInt(clientes.rows[0].total)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/financeiro/:dataInicio/:dataFim', async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.params;
    const entradas = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM movimentacoes WHERE tipo = 'entrada' AND data_movimento::date BETWEEN $1 AND $2`,
      [dataInicio, dataFim]
    );
    const saidas = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM movimentacoes WHERE tipo = 'saida' AND data_movimento::date BETWEEN $1 AND $2`,
      [dataInicio, dataFim]
    );
    const movimentacoes = await db.query(
      `SELECT DATE(data_movimento) AS data, tipo, categoria, COUNT(*) AS quantidade, SUM(valor) AS total
       FROM movimentacoes WHERE data_movimento::date BETWEEN $1 AND $2
       GROUP BY DATE(data_movimento), tipo, categoria ORDER BY DATE(data_movimento)`,
      [dataInicio, dataFim]
    );

    const totalEntrada = parseFloat(entradas.rows[0].total);
    const totalSaida = parseFloat(saidas.rows[0].total);

    res.json({
      periodo: { data_inicio: dataInicio, data_fim: dataFim },
      resumo: {
        total_entrada: totalEntrada,
        total_saida: totalSaida,
        lucro_liquido: totalEntrada - totalSaida
      },
      movimentacoes: movimentacoes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/faturamento', async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    const result = await db.query(
      `SELECT DATE(data_movimento) AS data, SUM(valor) AS total
       FROM movimentacoes WHERE tipo = 'entrada'
       AND data_movimento::date BETWEEN $1 AND $2
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
              COALESCE(SUM(a.preco_servico), 0) AS total_produzido
       FROM agendamentos a
       JOIN barbeiros b ON b.id = a.barbeiro_id
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
      `SELECT s.nome, COUNT(a.id) AS total_vendas, SUM(a.preco_servico) AS total_faturado
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
      `SELECT COALESCE(SUM(valor), 0) AS total FROM movimentacoes WHERE tipo = 'entrada' AND DATE(data_movimento) = $1`, [hoje]
    );
    const agendamentosHoje = await db.query(
      `SELECT COUNT(*) AS total FROM agendamentos WHERE data = $1 AND status != 'cancelado'`, [hoje]
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
