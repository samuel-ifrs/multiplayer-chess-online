import { Room } from './Room';

/**
 * In-memory store of all active rooms. Single-process only (see deploy notes).
 * Keeps a reverse index from socketId -> roomId for O(1) disconnect handling.
 */
export class RoomStore {
  private rooms = new Map<string, Room>();
  private socketIndex = new Map<string, string>();

  get(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  add(room: Room): void {
    this.rooms.set(room.id, room);
  }

  delete(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.clearTimers();
    for (const color of ['w', 'b'] as const) {
      const sid = room.players[color]?.socketId;
      if (sid) this.socketIndex.delete(sid);
    }
    this.rooms.delete(roomId);
  }

  /** Public, waiting rooms shown in the lobby. */
  listPublicWaiting() {
    const out = [];
    for (const room of this.rooms.values()) {
      if (!room.isPrivate && room.status === 'waiting')
        out.push(room.summary());
    }
    return out.sort((a, b) => b.createdAt - a.createdAt);
  }

  bindSocket(socketId: string, roomId: string): void {
    this.socketIndex.set(socketId, roomId);
  }

  roomIdForSocket(socketId: string): string | undefined {
    return this.socketIndex.get(socketId);
  }

  unbindSocket(socketId: string): void {
    this.socketIndex.delete(socketId);
  }

  all(): Room[] {
    return [...this.rooms.values()];
  }
}

export const roomStore = new RoomStore();
