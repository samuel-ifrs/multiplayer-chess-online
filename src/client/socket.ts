import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@shared/events'

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: AppSocket | null = null

/** Lazily create the single shared socket connection (browser only). */
export function getSocket(): AppSocket {
  if (typeof window === 'undefined') {
    throw new Error('getSocket() called during SSR')
  }
  if (!socket) {
    socket = io({
      path: '/socket.io',
      autoConnect: true,
      withCredentials: true,
    })
  }
  return socket
}
