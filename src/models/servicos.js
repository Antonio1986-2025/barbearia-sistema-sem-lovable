const db = require('../config/database');

const servicos = {
  async criar({ nome, duracaoMinutos, preco, descricao }) {
    const result = await db.query(
      `INSERT INTO servicos (nome, duracao_minutos, preco, descricao) VALUES ($1, $2, $3, $4) RETURNING *`,
      [nome, duracaoMinutos, preco, descricao]
    );
    return result.rows[0];
  },
  async listarTodos() {
    const result = await db.query(`SELECT * FROM servicos WHERE ativo = true ORDER BY nome`);
    return result.rows;
  },
  async buscarPorId(id) {
    const result = await db.query(`SELECT * FROM servicos WHERE id = $1`, [id]);
    return result.rows[0];
  },
  async atualizar(id, { nome, duracaoMinutos, preco, descricao }) {
    const result = await db.query(
      `UPDATE servicos SET nome = COALESCE($1, nome), duracao_minutos = COALESCE($2, duracao_minutos),
       preco = COALESCE($3, preco), descricao = COALESCE($4, descricao) WHERE id = $5 RETURNING *`,
      [nome, duracaoMinutos, preco, descricao, id]
    );
    return result.rows[0];
  },
};

module.exports = servicos;
