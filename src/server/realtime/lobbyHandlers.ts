import { z } from 'zod';
import { LOBBY_ROOM } from '../../shared/events';
import { TIME_CONTROL_IDS } from '../../shared/timeControls';
import { Room } from '../domain/Room';
import { roomStore } from '../domain/RoomStore';
import { hashPassword, verifyPassword } from '../auth/password';
import {
  broadcastLobbyUpdate,
  broadcastLobbyRemoved,
  startTicker
} from './lifecycle';
import type { ChessServer, ChessSocket } from './types';

const createSchema = z.object({
  name: z.string().trim().min(1).max(40),
  isPrivate: z.boolean(),
  password: z.string().min(1).max(64).optional(),
  timeControl: z.enum(TIME_CONTROL_IDS as [string, ...string[]]),
  colorPref: z.enum(['w', 'b', 'random'])
});

const joinSchema = z.object({
  roomId: z.string().min(1).max(16),
  password: z.string().max(64).optional()
});

export function registerLobbyHandlers(
  io: ChessServer,
  socket: ChessSocket
): void {
  const user = socket.data.user;

  socket.on('lobby:list', ack => {
    ack({ ok: true, data: roomStore.listPublicWaiting() });
  });

  socket.on('lobby:create', async (payload, ack) => {
    const parsed = createSchema.safeParse(payload);
    if (!parsed.success) {
      ack({ ok: false, error: 'invalid_input' });
      return;
    }
    const data = parsed.data;
    if (data.isPrivate && !data.password) {
      ack({ ok: false, error: 'password_required' });
      return;
    }

    const passwordHash =
      data.isPrivate && data.password
        ? await hashPassword(data.password)
        : null;
    const room = new Room(
      {
        name: data.name,
        isPrivate: data.isPrivate,
        passwordHash,
        timeControl: data.timeControl as Room['timeControl'],
        colorPref: data.colorPref
      },
      user
    );
    roomStore.add(room);

    room.bindSocket(user.id, socket.id);
    roomStore.bindSocket(socket.id, room.id);
    socket.join(room.id);

    if (!room.isPrivate) {
      io.to(LOBBY_ROOM).emit('lobby:room_added', room.summary());
    }
    ack({ ok: true, data: { roomId: room.id } });
  });

  socket.on('lobby:join', async (payload, ack) => {
    const parsed = joinSchema.safeParse(payload);
    if (!parsed.success) {
      ack({ ok: false, error: 'invalid_input' });
      return;
    }
    const { roomId, password } = parsed.data;
    const room = roomStore.get(roomId);
    if (!room) {
      ack({ ok: false, error: 'not_found' });
      return;
    }

    // Rejoining your own seat is handled by game:rejoin; here we expect a new player.
    const existing = room.slotByUserId(user.id);
    if (!existing) {
      if (room.status !== 'waiting' || room.playerCount() >= 2) {
        ack({ ok: false, error: 'full' });
        return;
      }
      if (room.isPrivate) {
        const ok =
          room.passwordHash && password
            ? await verifyPassword(password, room.passwordHash)
            : false;
        if (!ok) {
          ack({ ok: false, error: 'wrong_password' });
          return;
        }
      }
      room.addOpponent(user);
    }

    room.bindSocket(user.id, socket.id);
    roomStore.bindSocket(socket.id, room.id);
    socket.join(room.id);

    // Both seats filled -> start the game.
    if (room.bothPresent() && room.status === 'waiting') {
      room.start();
      startTicker(io, room);
      // Send each connected player their own snapshot (yourColor differs).
      for (const color of ['w', 'b'] as const) {
        const sid = room.players[color]?.socketId;
        if (sid)
          io.to(sid).emit(
            'game:start',
            room.snapshotFor(room.players[color]!.userId)
          );
      }
      // No longer joinable from the lobby.
      broadcastLobbyRemoved(io, room.id);
    } else {
      broadcastLobbyUpdate(io, room);
    }

    ack({ ok: true, data: room.snapshotFor(user.id) });
  });
}
