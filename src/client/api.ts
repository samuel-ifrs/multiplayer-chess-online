import type {
  GameHistoryEntry,
  LeaderboardEntry,
  PlayerStats,
  PublicUser,
} from '@shared/types'

async function postJson<T>(url: string, body: unknown): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as T
  return { ok: res.ok, status: res.status, data }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin' })
  if (!res.ok) throw new Error(`request failed: ${res.status}`)
  return (await res.json()) as T
}

export interface AuthResponse {
  user?: PublicUser
  error?: string
}

export const api = {
  register: (username: string, password: string) =>
    postJson<AuthResponse>('/api/auth/register', { username, password }),
  login: (username: string, password: string) =>
    postJson<AuthResponse>('/api/auth/login', { username, password }),
  logout: () => postJson<{ ok: true }>('/api/auth/logout', {}),
  leaderboard: () => getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard'),
  playerStats: (name: string) =>
    getJson<{ stats: PlayerStats }>(`/api/players/${encodeURIComponent(name)}/stats`),
  playerGames: (name: string) =>
    getJson<{ games: GameHistoryEntry[] }>(`/api/players/${encodeURIComponent(name)}/games`),
}
