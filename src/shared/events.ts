import type {
  ChatMessage,
  ClockState,
  Color,
  ColorPref,
  GameOver,
  GameSnapshot,
  GameStateUpdate,
  RoomSummary
} from './types';

import type { TimeControlId } from './timeControls';

// Generic ack envelope for request/response events.
export type Ack<T = void> =
  | ({ ok: true } & (T extends void ? object : { data: T }))
  | { ok: false; error: string };

// ---- Client -> Server payloads ----
export interface CreateRoomPayload {
  name: string;
  isPrivate: boolean;
  password?: string;
  timeControl: TimeControlId;
  colorPref: ColorPref;
}
export interface JoinRoomPayload {
  roomId: string;
  password?: string;
}
export interface MovePayload {
  roomId: string;
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
}
export interface RoomIdPayload {
  roomId: string;
}
export interface RespondDrawPayload {
  roomId: string;
  accept: boolean;
}
export interface ChatSendPayload {
  roomId: string;
  text: string;
}

// Strongly-typed server->client events (socket.io ServerToClientEvents).
export interface ServerToClientEvents {
  'lobby:room_added': (room: RoomSummary) => void;
  'lobby:room_updated': (room: RoomSummary) => void;
  'lobby:room_removed': (payload: { id: string }) => void;
  'game:start': (snapshot: GameSnapshot) => void;
  'game:state': (update: GameStateUpdate) => void;
  'clock:tick': (clock: ClockState) => void;
  'game:opponent_disconnected': (payload: { color: Color }) => void;
  'game:opponent_reconnected': (payload: { color: Color }) => void;
  'game:draw_offered': (payload: { by: Color }) => void;
  'game:draw_declined': () => void;
  'game:over': (payload: GameOver) => void;
  'chat:message': (message: ChatMessage) => void;
  'error:msg': (payload: { code: string; message: string }) => void;
}

// Strongly-typed client->server events (socket.io ClientToServerEvents).
export interface ClientToServerEvents {
  'lobby:list': (ack: (res: Ack<RoomSummary[]>) => void) => void;
  'lobby:create': (
    payload: CreateRoomPayload,
    ack: (res: Ack<{ roomId: string }>) => void
  ) => void;
  'lobby:join': (
    payload: JoinRoomPayload,
    ack: (res: Ack<GameSnapshot>) => void
  ) => void;
  'game:rejoin': (
    payload: RoomIdPayload,
    ack: (res: Ack<GameSnapshot>) => void
  ) => void;
  'game:move': (payload: MovePayload, ack: (res: Ack) => void) => void;
  'game:resign': (payload: RoomIdPayload) => void;
  'game:offer_draw': (payload: RoomIdPayload) => void;
  'game:respond_draw': (payload: RespondDrawPayload) => void;
  'chat:send': (payload: ChatSendPayload) => void;
}

// Per-socket data attached after handshake auth.
export interface SocketData {
  user: { id: number; username: string };
}

export const LOBBY_ROOM = 'lobby';
