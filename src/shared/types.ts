import type { TimeControlId } from './timeControls';

export type Color = 'w' | 'b';
export type ColorPref = 'w' | 'b' | 'random';

export function opposite(color: Color): Color {
  return color === 'w' ? 'b' : 'w';
}

/** Authenticated user as exposed to the client (never includes the password hash). */
export interface PublicUser {
  id: number;
  username: string;
}

export type RoomStatus = 'waiting' | 'playing' | 'finished';

/** How a finished game ended. */
export type GameReason =
  | 'checkmate'
  | 'resign'
  | 'timeout'
  | 'abandon'
  | 'stalemate'
  | 'draw_agreed'
  | 'draw_repetition'
  | 'draw_insufficient'
  | 'draw_fifty_move';

/** Outcome of a game: a winning color, or a draw. */
export type GameResult = Color | 'draw';

export interface GameOver {
  result: GameResult;
  reason: GameReason;
  /** Winning color when `result` is not a draw. */
  winner?: Color;
}

/** Remaining milliseconds per side plus whose clock is currently running. */
export interface ClockState {
  w: number;
  b: number;
  running: Color | null;
}

export interface PlayerView {
  username: string;
  color: Color;
  connected: boolean;
}

/** A room as shown in the public lobby list. */
export interface RoomSummary {
  id: string;
  name: string;
  isPrivate: boolean;
  timeControl: TimeControlId;
  status: RoomStatus;
  players: number; // 0..2
  createdAt: number;
}

export interface ChatMessage {
  from: Color | 'system';
  name: string;
  text: string;
  ts: number;
}

/** Full snapshot sent on game:start and game:rejoin so a client can fully render. */
export interface GameSnapshot {
  roomId: string;
  name: string;
  timeControl: TimeControlId;
  fen: string;
  /** SAN move list, in order. */
  history: string[];
  lastMove: { from: string; to: string } | null;
  turn: Color;
  clock: ClockState;
  status: RoomStatus;
  players: PlayerView[];
  /** The color assigned to the receiving client (null for spectators — not used yet). */
  yourColor: Color | null;
  chat: ChatMessage[];
  drawOfferBy: Color | null;
  result: GameOver | null;
}

/** Lightweight per-move state broadcast after each move. */
export interface GameStateUpdate {
  fen: string;
  lastMove: { from: string; to: string } | null;
  turn: Color;
  history: string[];
  clock: ClockState;
  status: RoomStatus;
  result: GameOver | null;
}

// ---- Persistence / data API shapes ----

export interface PlayerStats {
  username: string;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  /** 0..1 */
  winRate: number;
}

export interface LeaderboardEntry extends PlayerStats {
  rank: number;
}

export interface GameHistoryEntry {
  id: number;
  whiteName: string;
  blackName: string;
  result: GameResult;
  reason: GameReason;
  timeControl: TimeControlId;
  movesCount: number;
  pgn: string;
  endedAt: string;
}
