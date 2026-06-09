const express = require('express');
const router = express.Router();
const usuarios = require('../models/usuarios');

router.post('/', async (req, res) => {
  try {
    const { nome, telefone, email } = req.body;
    let usuario = await usuarios.buscarPorTelefone(telefone);
    if (!usuario) usuario = await usuarios.criar(nome, telefone, email);
    res.status(201).json(usuario);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/telefone/:telefone', async (req, res) => {
  try {
    const telefone = req.params.telefone;
    const barbeiros = require('../models/barbeiros');
    const db = require('../config/database');

    let usuario = await usuarios.buscarPorTelefone(telefone);
    if (usuario) {
      const dependentes = await usuarios.listarDependentes(usuario.id);
      return res.json({ ...usuario, tipo_acesso: 'cliente', dependentes });
    }

    const result = await db.query(
      `SELECT * FROM barbeiros WHERE telefone = $1 AND ativo = true`, [telefone]
    );
    if (result.rows[0]) {
      const barbeiro = result.rows[0];
      return res.json({ ...barbeiro, tipo_acesso: barbeiro.tipo_acesso || 'barbeiro' });
    }

    return res.status(404).json({ error: 'Telefone não encontrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const usuario = await usuarios.buscarPorId(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario nao encontrado' });
    const dependentes = await usuarios.listarDependentes(usuario.id);
    res.json({ ...usuario, dependentes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const lista = await usuarios.listarTodos();
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/dependentes', async (req, res) => {
  try {
    const { usuarioTitularId, nome, telefone, tipo } = req.body;
    const dependente = await usuarios.criarDependente(usuarioTitularId, nome, telefone, tipo);
    res.status(201).json(dependente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
