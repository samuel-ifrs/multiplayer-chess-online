import type { PublicUser } from '../shared/types';
import { getLeaderboard, getStats } from './db/playersRepo';
import { getPlayerGames } from './db/gamesRepo';

export interface InitialState {
  user: PublicUser | null;
  url: string;
  data: unknown;
}

/** The render function exported by src/client/entry-server.tsx. */
export type RenderFn = (
  url: string,
  state: InitialState
) => { html: string; head: string };

/** Pre-fetch any data a route needs for first paint (so SSR isn't a blank shell). */
export async function loadInitialData(url: string): Promise<unknown> {
  try {
    const path = url.split('?')[0];
    if (path === '/ranking') {
      return { leaderboard: await getLeaderboard(50) };
    }
    const profileMatch = path.match(/^\/profile\/([^/]+)$/);
    if (profileMatch) {
      const name = decodeURIComponent(profileMatch[1]);
      const [stats, games] = await Promise.all([
        getStats(name),
        getPlayerGames(name, 30)
      ]);
      return { profile: { name, stats, games } };
    }
  } catch (err) {
    console.error('[chess] SSR data load failed:', err);
  }
  return null;
}

/** Safe JSON for embedding in a <script> tag. */
function serializeState(state: InitialState): string {
  return JSON.stringify(state).replace(/</g, '\\u003c');
}

/** Compose the final HTML document from the Vite template and the rendered app. */
export function composeHtml(
  template: string,
  rendered: { html: string; head: string },
  state: InitialState
): string {
  const stateScript = `<script>window.__INITIAL_STATE__ = ${serializeState(state)}</script>`;
  return template
    .replace('<!--ssr-head-->', rendered.head)
    .replace('<!--ssr-outlet-->', rendered.html)
    .replace('<!--ssr-state-->', stateScript);
}
