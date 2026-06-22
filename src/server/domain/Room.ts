import { nanoid } from 'nanoid';
import { Game, type MoveInput } from './Game';
import { Clock } from './Clock';
import type {
  ChatMessage,
  Color,
  ColorPref,
  GameOver,
  GameSnapshot,
  GameStateUpdate,
  PlayerView,
  PublicUser,
  RoomStatus,
  RoomSummary
} from '../../shared/types';
import { opposite } from '../../shared/types';
import { isInfinite, type TimeControlId } from '../../shared/timeControls';

export interface PlayerSlot {
  userId: number;
  name: string;
  color: Color;
  socketId: string | null;
  connected: boolean;
  lastSeen: number;
}

export interface CreateRoomArgs {
  name: string;
  isPrivate: boolean;
  passwordHash: string | null;
  timeControl: TimeControlId;
  colorPref: ColorPref;
}

export class Room {
  readonly id: string;
  name: string;
  readonly isPrivate: boolean;
  readonly passwordHash: string | null;
  readonly timeControl: TimeControlId;
  status: RoomStatus = 'waiting';

  private readonly game = new Game();
  private readonly clock: Clock;
  readonly players: { w?: PlayerSlot; b?: PlayerSlot } = {};
  chat: ChatMessage[] = [];
  drawOfferBy: Color | null = null;
  result: GameOver | null = null;

  readonly createdAt = Date.now();
  startedAt: Date | null = null;

  /** Pending deletion timer when one/both players are gone. */
  deletionTimer: NodeJS.Timeout | null = null;
  /** Per-player reconnection grace timers, keyed by color. */
  graceTimers: { w?: NodeJS.Timeout; b?: NodeJS.Timeout } = {};
  /** Clock reconciliation ticker handle. */
  tickTimer: NodeJS.Timeout | null = null;

  constructor(args: CreateRoomArgs, creator: PublicUser) {
    this.id = nanoid(8);
    this.name = args.name;
    this.isPrivate = args.isPrivate;
    this.passwordHash = args.passwordHash;
    this.timeControl = args.timeControl;
    this.clock = new Clock(args.timeControl);

    const creatorColor = this.resolveColor(args.colorPref);
    this.players[creatorColor] = this.makeSlot(creator, creatorColor);
  }

  private resolveColor(pref: ColorPref): Color {
    if (pref === 'w' || pref === 'b') return pref;
    return Math.random() < 0.5 ? 'w' : 'b';
  }

  private makeSlot(user: PublicUser, color: Color): PlayerSlot {
    return {
      userId: user.id,
      name: user.username,
      color,
      socketId: null,
      connected: false,
      lastSeen: Date.now()
    };
  }

  playerCount(): number {
    return (this.players.w ? 1 : 0) + (this.players.b ? 1 : 0);
  }

  slotByUserId(userId: number): PlayerSlot | undefined {
    if (this.players.w?.userId === userId) return this.players.w;
    if (this.players.b?.userId === userId) return this.players.b;
    return undefined;
  }

  colorOf(userId: number): Color | null {
    return this.slotByUserId(userId)?.color ?? null;
  }

  emptyColor(): Color | null {
    if (!this.players.w) return 'w';
    if (!this.players.b) return 'b';
    return null;
  }

  /** Add the joining (second) player. Returns the assigned color or null if full. */
  addOpponent(user: PublicUser): Color | null {
    const color = this.emptyColor();
    if (!color) return null;
    this.players[color] = this.makeSlot(user, color);
    return color;
  }

  bothPresent(): boolean {
    return !!this.players.w && !!this.players.b;
  }

  timeControlIsInfinite(): boolean {
    return isInfinite(this.timeControl);
  }

  /** Begin the game once both seats are filled. */
  start(now = Date.now()): void {
    if (this.status !== 'waiting' || !this.bothPresent()) return;
    this.status = 'playing';
    this.startedAt = new Date(now);
    this.clock.start(this.game.turn(), now);
  }

  bindSocket(userId: number, socketId: string): void {
    const slot = this.slotByUserId(userId);
    if (!slot) return;
    slot.socketId = socketId;
    slot.connected = true;
    slot.lastSeen = Date.now();
  }

  markDisconnected(socketId: string): PlayerSlot | null {
    for (const color of ['w', 'b'] as Color[]) {
      const slot = this.players[color];
      if (slot && slot.socketId === socketId) {
        slot.connected = false;
        slot.socketId = null;
        slot.lastSeen = Date.now();
        return slot;
      }
    }
    return null;
  }

  allDisconnected(): boolean {
    const slots = [this.players.w, this.players.b].filter(
      Boolean
    ) as PlayerSlot[];
    return slots.length > 0 && slots.every(s => !s.connected);
  }

  // ---- Gameplay ----

  turn(): Color {
    return this.game.turn();
  }

  /** Validate & apply a move for `mover`. Returns false if illegal/not their turn. */
  applyMove(mover: Color, input: MoveInput, now = Date.now()): boolean {
    if (this.status !== 'playing') return false;
    if (this.game.turn() !== mover) return false;
    if (!this.game.move(input)) return false;
    this.clock.onMove(mover, now);
    this.drawOfferBy = null;
    return true;
  }

  /** Natural board outcome (mate/draw) after the last move, if any. */
  boardOutcome(): GameOver | null {
    return this.game.outcome();
  }

  /** Detect a flag (time-out). Returns the resulting GameOver or null. */
  checkFlag(now = Date.now()): GameOver | null {
    if (this.status !== 'playing') return null;
    const flagged = this.clock.flagged(now);
    if (!flagged) return null;
    // FIDE: timeout is a draw if the opponent cannot possibly mate.
    if (this.game.insufficientMaterial()) {
      return { result: 'draw', reason: 'draw_insufficient' };
    }
    const winner = opposite(flagged);
    return { result: winner, reason: 'timeout', winner };
  }

  finish(outcome: GameOver, now = Date.now()): void {
    if (this.status === 'finished') return;
    this.status = 'finished';
    this.result = outcome;
    this.clock.stop(now);
    this.drawOfferBy = null;
  }

  addChat(message: ChatMessage): void {
    this.chat.push(message);
    if (this.chat.length > 200) this.chat.shift();
  }

  // ---- Views ----

  summary(): RoomSummary {
    return {
      id: this.id,
      name: this.name,
      isPrivate: this.isPrivate,
      timeControl: this.timeControl,
      status: this.status,
      players: this.playerCount(),
      createdAt: this.createdAt
    };
  }

  private playerViews(): PlayerView[] {
    const views: PlayerView[] = [];
    for (const color of ['w', 'b'] as Color[]) {
      const slot = this.players[color];
      if (slot)
        views.push({ username: slot.name, color, connected: slot.connected });
    }
    return views;
  }

  stateUpdate(now = Date.now()): GameStateUpdate {
    return {
      fen: this.game.fen(),
      lastMove: this.game.lastMove(),
      turn: this.game.turn(),
      history: this.game.history(),
      clock: this.clock.snapshot(now),
      status: this.status,
      result: this.result
    };
  }

  snapshotFor(userId: number, now = Date.now()): GameSnapshot {
    return {
      roomId: this.id,
      name: this.name,
      timeControl: this.timeControl,
      fen: this.game.fen(),
      history: this.game.history(),
      lastMove: this.game.lastMove(),
      turn: this.game.turn(),
      clock: this.clock.snapshot(now),
      status: this.status,
      players: this.playerViews(),
      yourColor: this.colorOf(userId),
      chat: this.chat,
      drawOfferBy: this.drawOfferBy,
      result: this.result
    };
  }

  // ---- Persistence helpers ----

  pgn(): string {
    return this.game.pgn();
  }

  movesCount(): number {
    return this.game.movesCount();
  }

  clearTimers(): void {
    if (this.deletionTimer) clearTimeout(this.deletionTimer);
    if (this.graceTimers.w) clearTimeout(this.graceTimers.w);
    if (this.graceTimers.b) clearTimeout(this.graceTimers.b);
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.deletionTimer = null;
    this.graceTimers = {};
    this.tickTimer = null;
  }
}
