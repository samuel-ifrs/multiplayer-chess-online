import type { Color } from '@shared/types'
import { Piece, type PieceType } from '../pieces/Piece'
import styles from '../styles/Board.module.css'

export interface SquarePiece {
  type: PieceType
  color: Color
}

interface SquareProps {
  square: string
  light: boolean
  piece: SquarePiece | null
  selected: boolean
  legalTarget: boolean
  lastMove: boolean
  inCheck: boolean
  fileLabel: string | null
  rankLabel: string | null
  interactive: boolean
  onSelect: (square: string) => void
  onDragStartSquare: (square: string) => void
  onDropPiece: (from: string, to: string) => void
}

export function Square({
  square,
  light,
  piece,
  selected,
  legalTarget,
  lastMove,
  inCheck,
  fileLabel,
  rankLabel,
  interactive,
  onSelect,
  onDragStartSquare,
  onDropPiece,
}: SquareProps) {
  const classes = [
    styles.square,
    light ? styles.light : styles.dark,
    selected ? styles.selected : '',
    lastMove ? styles.lastMove : '',
    inCheck ? styles.check : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      onClick={() => onSelect(square)}
      onDragOver={(e) => {
        // Accept the drop on any square; legality is validated on drop.
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      }}
      onDrop={(e) => {
        e.preventDefault()
        const from = e.dataTransfer.getData('text/plain')
        if (from) onDropPiece(from, square)
      }}
      data-square={square}
    >
      {fileLabel && <span className={styles.fileLabel}>{fileLabel}</span>}
      {rankLabel && <span className={styles.rankLabel}>{rankLabel}</span>}
      {legalTarget && <span className={piece ? styles.captureHint : styles.moveHint} />}
      {piece && (
        <div
          className={`${styles.pieceWrap} ${interactive ? styles.pieceDraggable : ''}`}
          draggable={interactive}
          onDragStart={(e) => {
            if (!interactive) {
              e.preventDefault()
              return
            }
            e.dataTransfer.setData('text/plain', square)
            e.dataTransfer.effectAllowed = 'move'
            onDragStartSquare(square)
          }}
        >
          <Piece type={piece.type} color={piece.color} />
        </div>
      )}
    </div>
  )
}
