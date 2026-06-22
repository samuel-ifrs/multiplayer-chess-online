import { useMemo } from 'react';
import { Chess } from 'chess.js';
import type { Color } from '@shared/types';
import { Piece, type PieceType } from './pieces/Piece';
import styles from './styles/CapturedTray.module.css';

const START: Record<PieceType, number> = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
const VALUE: Record<PieceType, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const ORDER: PieceType[] = ['q', 'r', 'b', 'n', 'p'];

/** Pieces of `capturedColor` that have been taken (i.e. captured by the opponent). */
export function CapturedTray({
  fen,
  capturedColor
}: {
  fen: string;
  capturedColor: Color;
}) {
  const { pieces, advantage } = useMemo(() => {
    const chess = new Chess(fen);
    const counts: Record<Color, Record<PieceType, number>> = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
    };
    for (const row of chess.board()) {
      for (const cell of row) {
        if (cell) counts[cell.color][cell.type as PieceType]++;
      }
    }
    const taken: PieceType[] = [];
    const materialOf = (c: Color) =>
      ORDER.reduce((sum, t) => sum + counts[c][t] * VALUE[t], 0);
    for (const t of ORDER) {
      const missing = START[t] - counts[capturedColor][t];
      for (let i = 0; i < missing; i++) taken.push(t);
    }
    const other: Color = capturedColor === 'w' ? 'b' : 'w';
    return {
      pieces: taken,
      advantage: materialOf(other) - materialOf(capturedColor)
    };
  }, [fen, capturedColor]);

  return (
    <div className={styles.tray}>
      {pieces.map((t, i) => (
        <span key={i} className={styles.captured}>
          <Piece type={t} color={capturedColor} />
        </span>
      ))}
      {advantage > 0 && <span className={styles.adv}>+{advantage}</span>}
    </div>
  );
}
