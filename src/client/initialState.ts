import type { PublicUser } from '@shared/types';

export interface InitialState {
  user: PublicUser | null;
  url: string;
  data: unknown;
}

declare global {
  interface Window {
    __INITIAL_STATE__?: InitialState;
  }
}

export function readInitialState(): InitialState {
  if (typeof window !== 'undefined' && window.__INITIAL_STATE__) {
    return window.__INITIAL_STATE__;
  }
  return { user: null, url: '/', data: null };
}
