import type { Color, ClockState } from '../../shared/types'
import { incrementMs, initialClockMs, isInfinite, type TimeControlId } from '../../shared/timeControls'

/**
 * Authoritative dual chess clock. Time is computed lazily from timestamps — we never
 * rely on a high-frequency timer for the source of truth, which avoids drift.
 */
export class Clock {
  private remaining: { w: number; b: number }
  private readonly increment: number
  private readonly infinite: boolean
  private running: Color | null = null
  /** Epoch ms when the running side's countdown last (re)started. */
  private lastStart = 0

  constructor(timeControl: TimeControlId) {
    const base = initialClockMs(timeControl)
    this.remaining = { w: base, b: base }
    this.increment = incrementMs(timeControl)
    this.infinite = isInfinite(timeControl)
  }

  /** Start the clock for the side to move (called when the game begins). */
  start(turn: Color, now: number): void {
    if (this.infinite) return
    this.running = turn
    this.lastStart = now
  }

  isInfinite(): boolean {
    return this.infinite
  }

  isRunning(): boolean {
    return this.running !== null
  }

  /** Milliseconds left for `color` as of `now`, accounting for the live countdown. */
  remainingFor(color: Color, now: number): number {
    if (this.infinite) return 0
    let ms = this.remaining[color]
    if (this.running === color) ms -= now - this.lastStart
    return Math.max(0, ms)
  }

  /** Whether the side whose clock is running has flagged (run out of time) as of `now`. */
  flagged(now: number): Color | null {
    if (this.infinite || this.running === null) return null
    return this.remainingFor(this.running, now) <= 0 ? this.running : null
  }

  /**
   * Apply a completed move by `mover`: commit elapsed time, add the increment, and
   * hand the clock to the opponent. No-op for infinite controls.
   */
  onMove(mover: Color, now: number): void {
    if (this.infinite) return
    const elapsed = this.running === mover ? now - this.lastStart : 0
    this.remaining[mover] = Math.max(0, this.remaining[mover] - elapsed) + this.increment
    const next: Color = mover === 'w' ? 'b' : 'w'
    this.running = next
    this.lastStart = now
  }

  /** Freeze the clock (game over). */
  stop(now: number): void {
    if (this.infinite || this.running === null) return
    this.remaining[this.running] = this.remainingFor(this.running, now)
    this.running = null
  }

  snapshot(now: number): ClockState {
    return {
      w: this.remainingFor('w', now),
      b: this.remainingFor('b', now),
      running: this.running,
    }
  }
}
