const db = require('../config/database');

const agendamentos = {
  async criar({ usuarioTitularId, dependenteId, barbeiroId, servicoId, data, horaInicio, horaFim, duracaoMinutos, precoServico, observacoes }) {
    const result = await db.query(
      `INSERT INTO agendamentos (usuario_titular_id, dependente_id, barbeiro_id, servico_id, data, hora_inicio, hora_fim, duracao_minutos, preco_servico, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [usuarioTitularId, dependenteId, barbeiroId, servicoId, data, horaInicio, horaFim, duracaoMinutos, precoServico, observacoes]
    );
    return result.rows[0];
  },

  async listarPorBarbeiro(barbeiroId, data) {
    let query = `SELECT a.*, s.nome AS servico_nome, s.preco AS preco_padrao,
                        u.nome AS titular_nome, d.nome AS dependente_nome
                 FROM agendamentos a
                 JOIN servicos s ON s.id = a.servico_id
                 LEFT JOIN usuarios u ON u.id = a.usuario_titular_id
                 LEFT JOIN dependentes d ON d.id = a.dependente_id
                 WHERE a.barbeiro_id = $1`;
    const params = [barbeiroId];
    if (data) {
      query += ` AND a.data = $2 ORDER BY a.hora_inicio`;
      params.push(data);
    } else {
      query += ` AND a.data >= CURRENT_DATE ORDER BY a.data, a.hora_inicio`;
    }
    const result = await db.query(query, params);
    return result.rows;
  },

  async buscarHorariosDisponiveis(barbeiroId, servicoId, data) {
    const servico = await db.query(`SELECT duracao_minutos FROM servicos WHERE id = $1`, [servicoId]);
    if (!servico.rows[0]) return [];
    const duracao = servico.rows[0].duracao_minutos;

    const horarios = await db.query(
      `SELECT hora_inicio, hora_fim FROM barbeiro_horarios WHERE barbeiro_id = $1 AND dia_semana = EXTRACT(DOW FROM $2::DATE) AND ativo = true`,
      [barbeiroId, data]
    );
    if (horarios.rows.length === 0) return [];

    const noturno = await db.query(
      `SELECT hora_inicio, hora_fim FROM noturno_ativado WHERE barbeiro_id = $1 AND data = $2 AND ativo = true`,
      [barbeiroId, data]
    );
    if (noturno.rows.length > 0) horarios.rows.push(noturno.rows[0]);

    const bloqueios = await db.query(
      `SELECT hora_inicio, hora_fim FROM bloqueios_barbeiro
       WHERE barbeiro_id = $1 AND data_inicio <= $2 AND data_fim >= $2`,
      [barbeiroId, data]
    );

    const agendados = await db.query(
      `SELECT hora_inicio, hora_fim FROM agendamentos WHERE barbeiro_id = $1 AND data = $2 AND status != 'cancelado'`,
      [barbeiroId, data]
    );

    const slots = [];
    for (const h of horarios.rows) {
      let inicio = this.timeToMinutes(h.hora_inicio);
      const fim = this.timeToMinutes(h.hora_fim);
      while (inicio + duracao <= fim) {
        const fimSlot = inicio + duracao;
        const conflito = agendados.rows.some(a =>
          this.timeToMinutes(a.hora_inicio) < fimSlot && this.timeToMinutes(a.hora_fim) > inicio
        );
        const bloqueado = bloqueios.rows.some(b => {
          const bi = b.hora_inicio ? this.timeToMinutes(b.hora_inicio) : 0;
          const bf = b.hora_fim ? this.timeToMinutes(b.hora_fim) : 1440;
          return inicio < bf && fimSlot > bi;
        });
        if (!conflito && !bloqueado) {
          slots.push({
            data_hora: `${data}T${this.minutesToTime(inicio)}:00`,
            hora: this.minutesToTime(inicio)
          });
        }
        inicio += 30;
      }
    }
    return slots;
  },

  async verificarDisponibilidade(barbeiroId, data, horaInicio, horaFim) {
    const result = await db.query(
      `SELECT id FROM agendamentos
       WHERE barbeiro_id = $1 AND data = $2 AND status != 'cancelado'
       AND hora_inicio < $4 AND hora_fim > $3`,
      [barbeiroId, data, horaInicio, horaFim]
    );
    if (result.rows.length > 0) return false;

    const bloq = await db.query(
      `SELECT id FROM bloqueios_barbeiro
       WHERE barbeiro_id = $1 AND data_inicio <= $2 AND data_fim >= $2
       AND (hora_inicio IS NULL OR (hora_inicio < $4 AND hora_fim > $3))`,
      [barbeiroId, data, horaInicio, horaFim]
    );
    if (bloq.rows.length > 0) return false;

    return true;
  },

  async cancelar(id, motivo) {
    const result = await db.query(
      `UPDATE agendamentos SET status = 'cancelado', motivo_cancelamento = $2 WHERE id = $1 AND status = 'agendado' RETURNING *`,
      [id, motivo || null]
    );
    return result.rows[0];
  },

  async concluir(id) {
    const result = await db.query(
      `UPDATE agendamentos SET status = 'concluido' WHERE id = $1 AND status IN ('agendado', 'em_atendimento') RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  async iniciarAtendimento(id) {
    const result = await db.query(
      `UPDATE agendamentos SET status = 'em_atendimento' WHERE id = $1 AND status = 'agendado' RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  },

  minutesToTime(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  },
};

module.exports = agendamentos;
