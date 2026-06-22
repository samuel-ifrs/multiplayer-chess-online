import { useEffect, useRef, useState } from 'react';
import styles from './styles/Clock.module.css';

interface ClockProps {
  /** Authoritative ms remaining (snaps the display whenever it changes). */
  ms: number;
  /** Whether this side's clock is currently counting down. */
  running: boolean;
  /** Infinite time control — show ∞ and never count. */
  infinite: boolean;
  active: boolean;
  label: string;
}

function format(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function Clock({ ms, running, infinite, active, label }: ClockProps) {
  const [display, setDisplay] = useState(ms);
  const anchor = useRef({ ms, at: Date.now() });

  // Snap to the authoritative value whenever the server updates it.
  useEffect(() => {
    anchor.current = { ms, at: Date.now() };
    setDisplay(ms);
  }, [ms]);

  // Smooth local countdown between server ticks.
  useEffect(() => {
    if (!running || infinite) return;
    const id = setInterval(() => {
      const elapsed = Date.now() - anchor.current.at;
      setDisplay(Math.max(0, anchor.current.ms - elapsed));
    }, 200);
    return () => clearInterval(id);
  }, [running, infinite]);

  const low = !infinite && display <= 10_000;
  const classes = [
    styles.clock,
    active ? styles.active : '',
    low ? styles.low : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <span className={styles.label}>{label}</span>
      <span className={styles.time}>{infinite ? '∞' : format(display)}</span>
    </div>
  );
}
