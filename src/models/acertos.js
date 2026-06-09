const db = require('../config/database');

const acertos = {
  async criar({ barbeiroId, semanaInicio, semanaFim }) {
    const vales = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM vales WHERE barbeiro_id = $1 AND status = 'aberto'`,
      [barbeiroId]
    );
    const comissoes = await db.query(
      `SELECT COALESCE(SUM(valor_comissao), 0) AS total FROM comissoes WHERE barbeiro_id = $1 AND semana_inicio = $2 AND status = 'pendente'`,
      [barbeiroId, semanaInicio]
    );

    const result = await db.query(
      `INSERT INTO acertos_comissao (barbeiro_id, semana_inicio, semana_fim, valor_total_comissao, total_vales_descontados)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [barbeiroId, semanaInicio, semanaFim, comissoes.rows[0].total, vales.rows[0].total]
    );
    return result.rows[0];
  },

  async listarPorBarbeiro(barbeiroId) {
    const result = await db.query(
      `SELECT * FROM acertos_comissao WHERE barbeiro_id = $1 ORDER BY semana_inicio DESC`,
      [barbeiroId]
    );
    return result.rows;
  },

  async buscarPorId(id) {
    const result = await db.query(`SELECT * FROM acertos_comissao WHERE id = $1`, [id]);
    return result.rows[0];
  },

  async pagar(id, valorPago, responsavelId) {
    const acerto = await this.buscarPorId(id);
    if (!acerto) return null;

    const valorRestante = Number(acerto.valor_total_comissao) - Number(acerto.total_vales_descontados) - Number(acerto.valor_pago) - valorPago;
    let status = 'pago_parcial';
    if (valorRestante <= 0) status = 'pago_completo';

    const result = await db.query(
      `UPDATE acertos_comissao SET valor_pago = valor_pago + $2, status = $3, responsavel_pagamento_id = $4, data_pagamento = NOW() WHERE id = $1 RETURNING *`,
      [id, valorPago, status, responsavelId]
    );
    return result.rows[0];
  },

  async listarPendentes() {
    const result = await db.query(
      `SELECT a.*, b.nome AS barbeiro_nome FROM acertos_comissao a
       JOIN barbeiros b ON b.id = a.barbeiro_id
       WHERE a.status IN ('pendente', 'pago_parcial')
       ORDER BY a.semana_inicio`
    );
    return result.rows;
  },
};

module.exports = acertos;
