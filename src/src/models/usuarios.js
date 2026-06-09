const db = require('../config/database');

const usuarios = {
  async criar(nome, telefone, email = null) {
    const result = await db.query(
      `INSERT INTO usuarios (nome, telefone, email) VALUES ($1, $2, $3) RETURNING *`,
      [nome, telefone, email]
    );
    return result.rows[0];
  },
  async buscarPorTelefone(telefone) {
    const result = await db.query(`SELECT * FROM usuarios WHERE telefone = $1`, [telefone]);
    return result.rows[0];
  },
  async buscarPorId(id) {
    const result = await db.query(`SELECT * FROM usuarios WHERE id = $1`, [id]);
    return result.rows[0];
  },
  async listarTodos() {
    const result = await db.query(`SELECT * FROM usuarios ORDER BY nome`);
    return result.rows;
  },
  async criarDependente(usuarioTitularId, nome, telefone, tipo = 'filho') {
    const result = await db.query(
      `INSERT INTO dependentes (usuario_titular_id, nome, telefone, tipo) VALUES ($1, $2, $3, $4) RETURNING *`,
      [usuarioTitularId, nome, telefone, tipo]
    );
    return result.rows[0];
  },
  async listarDependentes(usuarioTitularId) {
    const result = await db.query(`SELECT * FROM dependentes WHERE usuario_titular_id = $1`, [usuarioTitularId]);
    return result.rows;
  },
};

module.exports = usuarios;
