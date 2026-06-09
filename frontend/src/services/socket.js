import { io } from 'socket.io-client'

const socket = io('/', {
  autoConnect: false,
})

export function connectBarbeiro(barbeiroId) {
  socket.connect()
  socket.emit('join_barbeiro', barbeiroId)
}

export function disconnect() {
  socket.disconnect()
}

export function onNovoAgendamento(callback) {
  socket.on('novo_agendamento', callback)
}

export function onComissaoAtualizada(callback) {
  socket.on('comissao_atualizada', callback)
}

export function removeListeners() {
  socket.off('novo_agendamento')
  socket.off('comissao_atualizada')
}

export default socket
