import { z } from 'zod'
import type { ChatMessage } from '../../shared/types'
import { roomStore } from '../domain/RoomStore'
import type { ChessServer, ChessSocket } from './types'

const chatSchema = z.object({
  roomId: z.string().min(1).max(16),
  text: z.string().trim().min(1).max(500),
})

export function registerChatHandlers(io: ChessServer, socket: ChessSocket): void {
  const user = socket.data.user

  socket.on('chat:send', (payload) => {
    const parsed = chatSchema.safeParse(payload)
    if (!parsed.success) return
    const room = roomStore.get(parsed.data.roomId)
    if (!room) return
    const color = room.colorOf(user.id)
    if (!color) return // only the two players may chat

    const message: ChatMessage = {
      from: color,
      name: user.username,
      text: parsed.data.text,
      ts: Date.now(),
    }
    room.addChat(message)
    io.to(room.id).emit('chat:message', message)
  })
}
