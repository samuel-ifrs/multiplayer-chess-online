import { LOBBY_ROOM } from '../../shared/events';
import type { GameOver } from '../../shared/types';
import { opposite } from '../../shared/types';
import { recordGame } from '../db/gamesRepo';
import { Room } from '../domain/Room';
import { roomStore } from '../domain/RoomStore';
import {
  BOTH_GONE_DELETE_MS,
  type ChessServer,
  FINISHED_TTL_MS,
  GRACE_MS,
  TICK_MS
} from './types';

/** Broadcast the per-move state to everyone in the room. */
export function broadcastState(io: ChessServer, room: Room): void {
  io.to(room.id).emit('game:state', room.stateUpdate());
}

/** Tell the lobby a room changed (or appeared/disappeared). */
export function broadcastLobbyUpdate(io: ChessServer, room: Room): void {
  // Private rooms never appear in the lobby list.
  if (room.isPrivate) return;
  io.to(LOBBY_ROOM).emit('lobby:room_updated', room.summary());
}

export function broadcastLobbyRemoved(io: ChessServer, roomId: string): void {
  io.to(LOBBY_ROOM).emit('lobby:room_removed', { id: roomId });
}

/** Start the 1s reconciliation ticker that also detects flag (timeout). */
export function startTicker(io: ChessServer, room: Room): void {
  if (room.tickTimer || room.timeControlIsInfinite()) return;
  room.tickTimer = setInterval(() => {
    if (room.status !== 'playing') return;
    const flag = room.checkFlag();
    if (flag) {
      endGame(io, room, flag);
      return;
    }
    io.to(room.id).emit('clock:tick', room.stateUpdate().clock);
  }, TICK_MS);
}

/** Finish a game: stop clocks/ticker, notify clients, persist, and schedule GC. */
export function endGame(io: ChessServer, room: Room, outcome: GameOver): void {
  if (room.status === 'finished') return;
  room.finish(outcome);
  if (room.tickTimer) {
    clearInterval(room.tickTimer);
    room.tickTimer = null;
  }
  io.to(room.id).emit('game:state', room.stateUpdate());
  io.to(room.id).emit('game:over', outcome);
  broadcastLobbyRemoved(io, room.id); // it's no longer joinable

  void persistGame(room, outcome);

  // Keep the room around briefly so both clients can render the result, then GC.
  room.deletionTimer = setTimeout(
    () => roomStore.delete(room.id),
    FINISHED_TTL_MS
  );
  console.debug(
    `Game in room ${room.id} ended with result ${outcome.result} by ${outcome.reason}`
  );
}

async function persistGame(room: Room, outcome: GameOver): Promise<void> {
  const white = room.players.w;
  const black = room.players.b;
  if (!white || !black || !room.startedAt) return;
  try {
    await recordGame({
      whiteId: white.userId,
      blackId: black.userId,
      whiteName: white.name,
      blackName: black.name,
      result: outcome.result,
      reason: outcome.reason,
      timeControl: room.timeControl,
      movesCount: room.movesCount(),
      pgn: room.pgn(),
      startedAt: room.startedAt
    });
  } catch (err) {
    console.error(`[chess] failed to persist game for room ${room.id}:`, err);
  }
}

/**
 * Handle a player's disconnect. Per the locked rule, the clock keeps running. We give
 * a 30s window to return; if it expires the remaining player wins by abandonment. If
 * both players are gone, the room is deleted after a short delay.
 */
export function handleDisconnect(
  io: ChessServer,
  room: Room,
  color: 'w' | 'b'
): void {
  const slot = room.players[color];
  if (!slot) return;

  // Notify the opponent (if any) that this side dropped.
  io.to(room.id).emit('game:opponent_disconnected', { color });

  if (room.allDisconnected()) {
    // Nobody is watching the board — delete soon unless someone returns.
    if (!room.deletionTimer) {
      room.deletionTimer = setTimeout(() => {
        broadcastLobbyRemoved(io, room.id);
        roomStore.delete(room.id);
      }, BOTH_GONE_DELETE_MS);
    }
    return;
  }

  // Opponent still present. If a game is in progress, start the abandon countdown.
  if (room.status === 'playing') {
    room.graceTimers[color] = setTimeout(() => {
      const cur = room.players[color];
      if (!cur || cur.connected || room.status !== 'playing') return;
      const winner = opposite(color);
      endGame(io, room, { result: winner, reason: 'abandon', winner });
    }, GRACE_MS);
  } else if (room.status === 'waiting') {
    // A waiting room whose only player left: clean it up.
    room.deletionTimer = setTimeout(() => {
      broadcastLobbyRemoved(io, room.id);
      roomStore.delete(room.id);
    }, BOTH_GONE_DELETE_MS);
  }
}

/** Cancel any pending grace/deletion timers when a player returns. */
export function cancelPendingDeletion(room: Room, color: 'w' | 'b'): void {
  if (room.graceTimers[color]) {
    clearTimeout(room.graceTimers[color]);
    room.graceTimers[color] = undefined;
  }
  if (room.deletionTimer) {
    clearTimeout(room.deletionTimer);
    room.deletionTimer = null;
  }
}
