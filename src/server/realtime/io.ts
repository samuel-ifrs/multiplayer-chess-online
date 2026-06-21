import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { LOBBY_ROOM } from '../../shared/events'
import { userFromCookieHeader } from '../auth/jwt'
import { roomStore } from '../domain/RoomStore'
import { registerLobbyHandlers } from './lobbyHandlers'
import { registerGameHandlers } from './gameHandlers'
import { registerChatHandlers } from './chatHandlers'
import { handleDisconnect } from './lifecycle'
import { type ChessServer, type ChessSocket, FINISHED_TTL_MS } from './types'

export function createSocketServer(httpServer: HttpServer): ChessServer {
  const io: ChessServer = new Server(httpServer, {
    path: '/socket.io',
    serveClient: false,
  })

  // Authenticate every socket from the JWT cookie sent in the handshake.
  io.use((socket: ChessSocket, next) => {
    const user = userFromCookieHeader(socket.handshake.headers.cookie)
    if (!user) {
      next(new Error('unauthorized'))
      return
    }
    socket.data.user = user
    next()
  })

  io.on('connection', (socket: ChessSocket) => {
    socket.join(LOBBY_ROOM)
    registerLobbyHandlers(io, socket)
    registerGameHandlers(io, socket)
    registerChatHandlers(io, socket)

    socket.on('disconnect', () => {
      const roomId = roomStore.roomIdForSocket(socket.id)
      roomStore.unbindSocket(socket.id)
      if (!roomId) return
      const room = roomStore.get(roomId)
      if (!room) return
      const slot = room.markDisconnected(socket.id)
      if (slot) handleDisconnect(io, room, slot.color)
    })
  })

  startSweep(io)
  return io
}

/** Safety-net sweep for orphaned / long-finished rooms. */
function startSweep(io: ChessServer): void {
  setInterval(() => {
    const now = Date.now()
    for (const room of roomStore.all()) {
      if (room.status === 'finished' && now - room.createdAt > FINISHED_TTL_MS * 4) {
        io.to(LOBBY_ROOM).emit('lobby:room_removed', { id: room.id })
        roomStore.delete(room.id)
      }
    }
  }, 15_000)
}
