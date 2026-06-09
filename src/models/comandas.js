const db = require('../config/database');

const comandas = {
  async criar(agendamentoId, clienteNome, titularNome) {
    const result = await db.query(
      `INSERT INTO comandas (agendamento_id, cliente_nome, titular_nome) VALUES ($1, $2, $3) RETURNING *`,
      [agendamentoId, clienteNome, titularNome]
    );
    return result.rows[0];
  },
  async buscarPorId(id) {
    const result = await db.query(
      `SELECT c.*, COALESCE(SUM(ic.valor * ic.quantidade), 0) AS total_calculado
       FROM comandas c LEFT JOIN itens_comanda ic ON ic.comanda_id = c.id
       WHERE c.id = $1 GROUP BY c.id`,
      [id]
    );
    return result.rows[0];
  },
  async buscarPorAgendamento(agendamentoId) {
    const result = await db.query(`SELECT * FROM comandas WHERE agendamento_id = $1`, [agendamentoId]);
    return result.rows[0];
  },
  async listarAbertas() {
    const result = await db.query(
      `SELECT c.*, b.nome AS barbeiro_nome FROM comandas c
       JOIN agendamentos a ON a.id = c.agendamento_id
       JOIN barbeiros b ON b.id = a.barbeiro_id
       WHERE c.status = 'aberta' ORDER BY c.data_abertura`
    );
    return result.rows;
  },
  async adicionarItem(comandaId, tipo, descricao, valor, quantidade = 1) {
    const result = await db.query(
      `INSERT INTO itens_comanda (comanda_id, tipo, descricao, valor, quantidade) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [comandaId, tipo, descricao, valor, quantidade]
    );
    await db.query(`UPDATE comandas SET total = (SELECT COALESCE(SUM(valor * quantidade), 0) FROM itens_comanda WHERE comanda_id = $1) WHERE id = $1`, [comandaId]);
    return result.rows[0];
  },
  async pagar(id, formaPagamento) {
    const result = await db.query(
      `UPDATE comandas SET status = 'fechada', data_fechamento = NOW(), forma_pagamento = $1 WHERE id = $2 RETURNING *`,
      [formaPagamento, id]
    );
    return result.rows[0];
  },
  async listarItens(comandaId) {
    const result = await db.query(`SELECT * FROM itens_comanda WHERE comanda_id = $1 ORDER BY data_adicao`, [comandaId]);
    return result.rows;
  },
};

module.exports = comandas;
