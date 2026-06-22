import { useEffect, useRef } from 'react';
import styles from './styles/MoveList.module.css';

export function MoveList({ history }: { history: string[] }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [history]);

  // Group into [white, black] pairs.
  const rows: { n: number; w: string; b?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({ n: i / 2 + 1, w: history[i], b: history[i + 1] });
  }

  return (
    <ol className={styles.list} ref={ref}>
      {rows.map(row => (
        <li key={row.n} className={styles.row}>
          <span className={styles.num}>{row.n}.</span>
          <span className={styles.san}>{row.w}</span>
          <span className={styles.san}>{row.b ?? ''}</span>
        </li>
      ))}
    </ol>
  );
}
