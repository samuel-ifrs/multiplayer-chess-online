import {
  broadcastState,
  cancelPendingDeletion,
  endGame,
  startTicker
} from './lifecycle';
import type { ChessServer, ChessSocket } from './types';

import { z } from 'zod';
import { opposite } from '../../shared/types';
import { roomStore } from '../domain/RoomStore';

const moveSchema = z.object({
  roomId: z.string().min(1).max(16),
  from: z.string().regex(/^[a-h][1-8]$/),
  to: z.string().regex(/^[a-h][1-8]$/),
  promotion: z.enum(['q', 'r', 'b', 'n']).optional()
});
const roomIdSchema = z.object({ roomId: z.string().min(1).max(16) });
const respondDrawSchema = z.object({
  roomId: z.string().min(1).max(16),
  accept: z.boolean()
});

export function registerGameHandlers(
  io: ChessServer,
  socket: ChessSocket
): void {
  const user = socket.data.user;

  socket.on('game:rejoin', (payload, ack) => {
    const parsed = roomIdSchema.safeParse(payload);
    if (!parsed.success) return ack({ ok: false, error: 'invalid_input' });
    const room = roomStore.get(parsed.data.roomId);
    if (!room) return ack({ ok: false, error: 'not_found' });
    const color = room.colorOf(user.id);
    if (!color) return ack({ ok: false, error: 'not_a_player' });

    room.bindSocket(user.id, socket.id);
    roomStore.bindSocket(socket.id, room.id);
    socket.join(room.id);
    cancelPendingDeletion(room, color);

    if (room.status === 'playing' && !room.tickTimer) startTicker(io, room);
    socket.to(room.id).emit('game:opponent_reconnected', { color });
    ack({ ok: true, data: room.snapshotFor(user.id) });
  });

  socket.on('game:move', (payload, ack) => {
    const parsed = moveSchema.safeParse(payload);
    if (!parsed.success) return ack({ ok: false, error: 'invalid_input' });
    const room = roomStore.get(parsed.data.roomId);
    if (!room) return ack({ ok: false, error: 'not_found' });
    const color = room.colorOf(user.id);
    if (!color) return ack({ ok: false, error: 'not_a_player' });
    if (room.turn() !== color)
      return ack({ ok: false, error: 'not_your_turn' });

    const ok = room.applyMove(color, {
      from: parsed.data.from,
      to: parsed.data.to,
      promotion: parsed.data.promotion
    });
    console.trace(
      `Move in room ${room.id} by ${user.username} (${color}): ${parsed.data.from} -> ${parsed.data.to}${parsed.data.promotion ? `=${parsed.data.promotion.toUpperCase()}` : ''} (ok: ${ok})`
    );
    if (!ok) return ack({ ok: false, error: 'illegal_move' });

    ack({ ok: true });

    const outcome = room.boardOutcome();
    if (outcome) {
      endGame(io, room, outcome);
    } else {
      broadcastState(io, room);
    }
  });

  socket.on('game:resign', payload => {
    const parsed = roomIdSchema.safeParse(payload);
    if (!parsed.success) return;
    const room = roomStore.get(parsed.data.roomId);
    if (!room || room.status !== 'playing') return;
    const color = room.colorOf(user.id);
    if (!color) return;
    const winner = opposite(color);
    endGame(io, room, { result: winner, reason: 'resign', winner });
  });

  socket.on('game:offer_draw', payload => {
    const parsed = roomIdSchema.safeParse(payload);
    if (!parsed.success) return;
    const room = roomStore.get(parsed.data.roomId);
    if (!room || room.status !== 'playing') return;
    const color = room.colorOf(user.id);
    if (!color) return;
    room.drawOfferBy = color;
    socket.to(room.id).emit('game:draw_offered', { by: color });
  });

  socket.on('game:respond_draw', payload => {
    const parsed = respondDrawSchema.safeParse(payload);
    if (!parsed.success) return;
    const room = roomStore.get(parsed.data.roomId);
    if (!room || room.status !== 'playing') return;
    const color = room.colorOf(user.id);
    if (!color || !room.drawOfferBy || room.drawOfferBy === color) return;

    if (parsed.data.accept) {
      endGame(io, room, { result: 'draw', reason: 'draw_agreed' });
    } else {
      room.drawOfferBy = null;
      io.to(room.id).emit('game:draw_declined');
    }
  });
}
