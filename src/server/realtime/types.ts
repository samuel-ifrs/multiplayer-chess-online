import type { Server, Socket } from 'socket.io'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from '../../shared/events'

// Inter-server events are unused (single process), so an empty interface is fine.
export interface InterServerEvents {}

export type ChessServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>

export type ChessSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>

// Timing constants.
export const GRACE_MS = 30_000 // reconnection window before abandon
export const BOTH_GONE_DELETE_MS = 30_000 // delete a room once both players are gone
export const FINISHED_TTL_MS = 120_000 // keep a finished room briefly so clients render the result
export const TICK_MS = 1_000 // clock reconciliation cadence
