import {
  faChessBishop,
  faChessKing,
  faChessKnight,
  faChessPawn,
  faChessQueen,
  faChessRook,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import type { Color } from "@shared/types";

export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

interface PieceProps {
  type: PieceType;
  color: Color;
  className?: string;
}

// FontAwesome 7 free solid chess glyphs, one per piece type.
const ICONS: Record<PieceType, IconDefinition> = {
  k: faChessKing,
  q: faChessQueen,
  r: faChessRook,
  b: faChessBishop,
  n: faChessKnight,
  p: faChessPawn,
};

export function Piece({ type, color, className }: PieceProps) {
  const icon = ICONS[type];
  const [width, height, , , path] = icon.icon as [
    number,
    number,
    string[],
    string,
    string,
  ];

  // Flat single-color FA silhouettes with a thin dark outline so the white set reads
  // on light squares; a soft drop-shadow lifts the dark set off the dark squares.
  const fill = color === "w" ? "#f7f3ec" : "#262220";
  const stroke = "#1b1815";

  // Pad the viewBox by the stroke half-width (+margin) so the outline is never clipped,
  // while the SVG stays clipped to its own box so pieces never bleed into other squares.
  const pad = 50;

  return (
    <svg
      viewBox={`${-pad} ${-pad} ${width + pad * 2} ${height + pad * 2}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      role="img"
      aria-label={`${color === "w" ? "white" : "black"} ${type}`}
      data-color={color}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        filter: "drop-shadow(0 1.5px 1.5px rgba(0,0,0,.4))",
      }}
    >
      <path
        d={path}
        fill={fill}
        stroke={stroke}
        strokeWidth={8}
        paintOrder="stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}
