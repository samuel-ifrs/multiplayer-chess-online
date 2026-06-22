// Time control presets. `initial` = base minutes, `increment` = seconds added per move.
// `inf` is untimed (no clock).

export type TimeControlId =
  | '1+1'
  | '3+0'
  | '3+1'
  | '10+0'
  | '10+5'
  | '15+0'
  | 'inf';

export interface TimeControl {
  id: TimeControlId;
  /** Base time in minutes (0 for infinity). */
  initialMinutes: number;
  /** Increment in seconds added after each move. */
  incrementSeconds: number;
  label: string;
}

export const TIME_CONTROLS: Record<TimeControlId, TimeControl> = {
  '1+1': { id: '1+1', initialMinutes: 1, incrementSeconds: 1, label: '1 + 1' },
  '3+0': { id: '3+0', initialMinutes: 3, incrementSeconds: 0, label: '3 + 0' },
  '3+1': { id: '3+1', initialMinutes: 3, incrementSeconds: 1, label: '3 + 1' },
  '10+0': {
    id: '10+0',
    initialMinutes: 10,
    incrementSeconds: 0,
    label: '10 + 0'
  },
  '10+5': {
    id: '10+5',
    initialMinutes: 10,
    incrementSeconds: 5,
    label: '10 + 5'
  },
  '15+0': {
    id: '15+0',
    initialMinutes: 15,
    incrementSeconds: 0,
    label: '15 + 0'
  },
  inf: { id: 'inf', initialMinutes: 0, incrementSeconds: 0, label: '∞' }
};

export const TIME_CONTROL_IDS = Object.keys(TIME_CONTROLS) as TimeControlId[];

export function isTimeControlId(value: unknown): value is TimeControlId {
  return typeof value === 'string' && value in TIME_CONTROLS;
}

/** Initial milliseconds on each player's clock for a given control (0 for infinity). */
export function initialClockMs(id: TimeControlId): number {
  return TIME_CONTROLS[id].initialMinutes * 60_000;
}

export function incrementMs(id: TimeControlId): number {
  return TIME_CONTROLS[id].incrementSeconds * 1000;
}

export function isInfinite(id: TimeControlId): boolean {
  return id === 'inf';
}
