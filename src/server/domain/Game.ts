import { Chess, type Move } from 'chess.js'
import type { Color, GameOver, GameReason } from '../../shared/types'

export interface MoveInput {
  from: string
  to: string
  promotion?: 'q' | 'r' | 'b' | 'n'
}

/**
 * Thin wrapper over chess.js. The server applies and validates every move here;
 * the resulting FEN is the single source of truth broadcast to clients.
 */
export class Game {
  private chess = new Chess()
  private last: { from: string; to: string } | null = null

  fen(): string {
    return this.chess.fen()
  }

  turn(): Color {
    return this.chess.turn()
  }

  /** SAN history. */
  history(): string[] {
    return this.chess.history()
  }

  pgn(): string {
    return this.chess.pgn()
  }

  movesCount(): number {
    return this.chess.history().length
  }

  lastMove(): { from: string; to: string } | null {
    return this.last
  }

  /** Legal moves from a square (verbose), for client-side highlight parity if needed. */
  movesFrom(square: string): Move[] {
    return this.chess.moves({ square: square as never, verbose: true })
  }

  /**
   * Attempt a move. Returns true if legal and applied, false otherwise.
   * chess.js throws on an illegal move, so we catch and report.
   */
  move(input: MoveInput): boolean {
    try {
      const result = this.chess.move({
        from: input.from,
        to: input.to,
        promotion: input.promotion ?? 'q',
      })
      if (!result) return false
      this.last = { from: result.from, to: result.to }
      return true
    } catch {
      return false
    }
  }

  isGameOver(): boolean {
    return this.chess.isGameOver()
  }

  /**
   * For the FIDE timeout rule: when a player flags, it's a draw if the position is
   * such that no checkmate is possible. chess.js's global check covers the practical
   * cases (K vs K, K+minor vs K).
   */
  insufficientMaterial(): boolean {
    return this.chess.isInsufficientMaterial()
  }

  /**
   * Determine the natural end of the game from the board, if any (mate/draw).
   * Returns null while the game is still ongoing.
   */
  outcome(): GameOver | null {
    if (this.chess.isCheckmate()) {
      // The side to move is checkmated, so the *other* side won.
      const winner: Color = this.chess.turn() === 'w' ? 'b' : 'w'
      return { result: winner, reason: 'checkmate', winner }
    }
    if (this.chess.isStalemate()) {
      return { result: 'draw', reason: 'stalemate' }
    }
    if (this.chess.isInsufficientMaterial()) {
      return { result: 'draw', reason: 'draw_insufficient' }
    }
    if (this.chess.isThreefoldRepetition()) {
      return { result: 'draw', reason: 'draw_repetition' }
    }
    if (this.chess.isDraw()) {
      // Remaining draw condition handled by chess.js is the 50-move rule.
      return { result: 'draw', reason: 'draw_fifty_move' as GameReason }
    }
    return null
  }
}
