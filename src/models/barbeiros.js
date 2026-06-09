const db = require('../config/database');

const barbeiros = {
  async criar({ nome, telefone, email, tipoAcesso, horarios, especialidades }) {
    const result = await db.query(
      `INSERT INTO barbeiros (nome, telefone, email, tipo_acesso) VALUES ($1, $2, $3, $4) RETURNING *`,
      [nome, telefone, email, tipoAcesso || 'barbeiro']
    );
    const barbeiro = result.rows[0];
    if (horarios) {
      for (const h of horarios) {
        await db.query(
          `INSERT INTO barbeiro_horarios (barbeiro_id, dia_semana, hora_inicio, hora_fim) VALUES ($1, $2, $3, $4)`,
          [barbeiro.id, h.diaSemana, h.horaInicio, h.horaFim]
        );
      }
    }
    if (especialidades) {
      for (const e of especialidades) {
        await db.query(
          `INSERT INTO barbeiro_especialidades (barbeiro_id, servico_id, preco_customizado) VALUES ($1, $2, $3)`,
          [barbeiro.id, e.servicoId, e.precoCustomizado || null]
        );
      }
    }
    return barbeiro;
  },
  async listarTodos() {
    const result = await db.query(`SELECT * FROM barbeiros WHERE ativo = true ORDER BY nome`);
    return result.rows;
  },
  async buscarPorId(id) {
    const result = await db.query(`SELECT * FROM barbeiros WHERE id = $1`, [id]);
    return result.rows[0];
  },
  async buscarEspecialidades(barbeiroId) {
    const result = await db.query(
      `SELECT s.*, be.preco_customizado FROM barbeiro_especialidades be 
       JOIN servicos s ON s.id = be.servico_id 
       WHERE be.barbeiro_id = $1 AND be.ativo = true`,
      [barbeiroId]
    );
    return result.rows;
  },
  async buscarHorarios(barbeiroId) {
    const result = await db.query(
      `SELECT * FROM barbeiro_horarios WHERE barbeiro_id = $1 AND ativo = true ORDER BY dia_semana, hora_inicio`,
      [barbeiroId]
    );
    return result.rows;
  },
  async ativarNoturno(barbeiroId, data, ativo) {
    if (ativo) {
      await db.query(
        `INSERT INTO barbeiro_noturno (barbeiro_id, data, hora_inicio, hora_fim) 
         VALUES ($1, $2, '19:00', '21:00') ON CONFLICT (barbeiro_id, data) DO UPDATE SET ativo = true`,
        [barbeiroId, data]
      );
    } else {
      await db.query(
        `UPDATE barbeiro_noturno SET ativo = false WHERE barbeiro_id = $1 AND data = $2`,
        [barbeiroId, data]
      );
    }
  },
  async verificarDisponibilidade(barbeiroId, data, horaInicio, horaFim) {
    const result = await db.query(
      `SELECT id FROM agendamentos 
       WHERE barbeiro_id = $1 AND data = $2 AND status != 'cancelado'
       AND hora_inicio < $4 AND hora_fim > $3`,
      [barbeiroId, data, horaInicio, horaFim]
    );
    return result.rows.length === 0;
  },
};

module.exports = barbeiros;
