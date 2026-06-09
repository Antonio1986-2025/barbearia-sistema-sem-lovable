const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timezone: 'America/Campo_Grande' });
});

const agendamentosRouter = require('./routes/agendamentos');
const barbeirosRouter = require('./routes/barbeiros');
const comandasRouter = require('./routes/comandas');
const comissoesRouter = require('./routes/comissoes');
const servicosRouter = require('./routes/servicos');
const usuariosRouter = require('./routes/usuarios');
const relatoriosRouter = require('./routes/relatorios');
const acertosRouter = require('./routes/acertos');

app.use('/api/agendamentos', agendamentosRouter);
app.use('/api/barbeiros', barbeirosRouter);
app.use('/api/comandas', comandasRouter);
app.use('/api/comissoes', comissoesRouter);
app.use('/api/servicos', servicosRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/relatorios', relatoriosRouter);
app.use('/api/acertos', acertosRouter);

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  socket.on('join_barbeiro', (barbeiroId) => {
    socket.join(`barbeiro_${barbeiroId}`);
  });
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Fuso horário: America/Campo_Grande (GMT-4)`);
});

module.exports = { app, server, io };
