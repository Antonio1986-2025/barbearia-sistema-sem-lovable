const db = require('../config/database');

const comissoes = {
  async gerar(barbeiroId, agendamentoId, comandaId, valorServico) {
    const percentual = 50;
    const valorComissao = valorServico * (percentual / 100);
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    const diffParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
    const segunda = new Date(hoje);
    segunda.setDate(hoje.getDate() + diffParaSegunda);
    const domingo = new Date(segunda);
    domingo.setDate(segunda.getDate() + 6);

    const result = await db.query(
      `INSERT INTO comissoes (barbeiro_id, agendamento_id, comanda_id, valor_servico, percentual_comissao, valor_comissao, semana_inicio, semana_fim)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [barbeiroId, agendamentoId, comandaId, valorServico, percentual, valorComissao, segunda.toISOString().split('T')[0], domingo.toISOString().split('T')[0]]
    );
    return result.rows[0];
  },

  async listarPorBarbeiro(barbeiroId, semanas = 4) {
    const result = await db.query(
      `SELECT * FROM comissoes WHERE barbeiro_id = $1 ORDER BY data_geracao DESC LIMIT $2`,
      [barbeiroId, semanas * 7]
    );
    return result.rows;
  },

  async resumoSemana(barbeiroId, dataInicio, dataFim) {
    const result = await db.query(
      `SELECT COUNT(*) AS total_atendimentos, COALESCE(SUM(valor_servico), 0) AS total_produzido,
              COALESCE(SUM(valor_comissao), 0) AS total_comissao
       FROM comissoes WHERE barbeiro_id = $1 AND semana_inicio = $2 AND semana_fim = $3`,
      [barbeiroId, dataInicio, dataFim]
    );
    const vales = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS total_vales FROM vales WHERE barbeiro_id = $1 AND status = 'aberto'`,
      [barbeiroId]
    );
    return {
      comissao_total_pendente: parseFloat(result.rows[0].total_comissao),
      vales_abertos: parseFloat(vales.rows[0].total_vales),
      saldo_a_receber: parseFloat(result.rows[0].total_comissao) - parseFloat(vales.rows[0].total_vales)
    };
  },

  async registrarVale(barbeiroId, valor, observacoes = '') {
    const result = await db.query(
      `INSERT INTO vales (barbeiro_id, valor, observacoes) VALUES ($1, $2, $3) RETURNING *`,
      [barbeiroId, valor, observacoes]
    );
    return result.rows[0];
  },

  async pagarComissao(comissaoId) {
    const result = await db.query(
      `UPDATE comissoes SET status = 'paga', data_pagamento = NOW() WHERE id = $1 RETURNING *`,
      [comissaoId]
    );
    return result.rows[0];
  },

  async pagarTodasSemana(barbeiroId, dataInicio, dataFim) {
    const result = await db.query(
      `UPDATE comissoes SET status = 'paga', data_pagamento = NOW() WHERE barbeiro_id = $1 AND semana_inicio = $2 AND semana_fim = $3 AND status = 'pendente' RETURNING *`,
      [barbeiroId, dataInicio, dataFim]
    );
    return result.rows;
  },

  async listarVales(barbeiroId) {
    const result = await db.query(
      `SELECT * FROM vales WHERE barbeiro_id = $1 ORDER BY data_vale DESC`, [barbeiroId]
    );
    return result.rows;
  },

  async descontaVale(valeId) {
    const result = await db.query(
      `UPDATE vales SET status = 'descontado', data_desconto = NOW() WHERE id = $1 RETURNING *`,
      [valeId]
    );
    return result.rows[0];
  },
};

module.exports = comissoes;
