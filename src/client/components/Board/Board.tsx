import { useMemo, useState } from 'react'
import { Chess, type Square as Sq } from 'chess.js'
import type { Color } from '@shared/types'
import { Piece, type PieceType } from '../pieces/Piece'
import { Square, type SquarePiece } from './Square'
import styles from '../styles/Board.module.css'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1']

interface BoardProps {
  fen: string
  orientation: Color
  /** Whose move it is, for highlighting + interactivity. */
  myColor: Color | null
  interactive: boolean
  lastMove: { from: string; to: string } | null
  onMove: (from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n') => void
}

export function Board({ fen, orientation, myColor, interactive, lastMove, onMove }: BoardProps) {
  const chess = useMemo(() => new Chess(fen), [fen])
  const [selected, setSelected] = useState<string | null>(null)
  const [promotion, setPromotion] = useState<{ from: string; to: string } | null>(null)

  const board = useMemo(() => {
    const map = new Map<string, SquarePiece>()
    for (const row of chess.board()) {
      for (const cell of row) {
        if (cell) map.set(cell.square, { type: cell.type as PieceType, color: cell.color })
      }
    }
    return map
  }, [chess])

  const legalTargets = useMemo(() => {
    if (!selected) return new Set<string>()
    const moves = chess.moves({ square: selected as Sq, verbose: true })
    return new Set(moves.map((m) => m.to))
  }, [chess, selected])

  const checkSquare = useMemo(() => {
    if (!chess.inCheck()) return null
    const turn = chess.turn()
    for (const [sq, p] of board) {
      if (p.type === 'k' && p.color === turn) return sq
    }
    return null
  }, [chess, board])

  const files = orientation === 'w' ? FILES : [...FILES].reverse()
  const ranks = orientation === 'w' ? RANKS : [...RANKS].reverse()

  const tryMove = (from: string, to: string) => {
    const moves = chess.moves({ square: from as Sq, verbose: true })
    const move = moves.find((m) => m.to === to)
    if (!move) return
    if (move.promotion) {
      setPromotion({ from, to })
    } else {
      onMove(from, to)
    }
    setSelected(null)
  }

  const handleSelect = (square: string) => {
    if (!interactive) return
    const piece = board.get(square)
    if (selected && legalTargets.has(square)) {
      tryMove(selected, square)
      return
    }
    if (piece && piece.color === myColor) {
      setSelected(square === selected ? null : square)
    } else {
      setSelected(null)
    }
  }

  const handleDrop = (from: string, to: string) => {
    if (!interactive) return
    setSelected(null)
    tryMove(from, to)
  }

  return (
    <div className={styles.boardWrap}>
      <div className={styles.board}>
        {ranks.map((rank, r) =>
          files.map((file, f) => {
            const square = `${file}${rank}`
            const light = (r + f) % 2 === 0
            return (
              <Square
                key={square}
                square={square}
                light={light}
                piece={board.get(square) ?? null}
                selected={selected === square}
                legalTarget={legalTargets.has(square)}
                lastMove={lastMove?.from === square || lastMove?.to === square}
                inCheck={checkSquare === square}
                fileLabel={r === ranks.length - 1 ? file : null}
                rankLabel={f === 0 ? rank : null}
                interactive={interactive && board.get(square)?.color === myColor}
                onSelect={handleSelect}
                onDragStartSquare={(sq) => interactive && setSelected(sq)}
                onDropPiece={handleDrop}
              />
            )
          }),
        )}
      </div>

      {promotion && myColor && (
        <div className={styles.promotion} onClick={() => setPromotion(null)}>
          <div className={styles.promotionRow} onClick={(e) => e.stopPropagation()}>
            {(['q', 'r', 'b', 'n'] as const).map((p) => (
              <button
                key={p}
                className={styles.promoBtn}
                onClick={() => {
                  onMove(promotion.from, promotion.to, p)
                  setPromotion(null)
                }}
              >
                <Piece type={p} color={myColor} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
