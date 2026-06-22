import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getPool } from './pool';
import type { LeaderboardEntry, PlayerStats } from '../../shared/types';

export interface PlayerRow {
  id: number;
  username: string;
  password_hash: string;
  wins: number;
  losses: number;
  draws: number;
  games_played: number;
}

export async function findByUsername(
  username: string
): Promise<PlayerRow | null> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    'SELECT * FROM players WHERE username = :username LIMIT 1',
    { username }
  );
  return (rows[0] as PlayerRow) ?? null;
}

export async function findById(id: number): Promise<PlayerRow | null> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    'SELECT * FROM players WHERE id = :id LIMIT 1',
    { id }
  );
  return (rows[0] as PlayerRow) ?? null;
}

export async function createPlayer(
  username: string,
  passwordHash: string
): Promise<PlayerRow> {
  const [res] = await getPool().query<ResultSetHeader>(
    'INSERT INTO players (username, password_hash) VALUES (:username, :passwordHash)',
    { username, passwordHash }
  );
  return {
    id: res.insertId,
    username,
    password_hash: passwordHash,
    wins: 0,
    losses: 0,
    draws: 0,
    games_played: 0
  };
}

function toStats(row: RowDataPacket | PlayerRow): PlayerStats {
  const wins = Number(row.wins);
  const losses = Number(row.losses);
  const draws = Number(row.draws);
  const gamesPlayed = Number(row.games_played);
  return {
    username: row.username,
    wins,
    losses,
    draws,
    gamesPlayed,
    winRate: gamesPlayed > 0 ? wins / gamesPlayed : 0
  };
}

export async function getStats(username: string): Promise<PlayerStats | null> {
  const row = await findByUsername(username);
  return row ? toStats(row) : null;
}

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    `SELECT username, wins, losses, draws, games_played
     FROM players
     WHERE games_played > 0
     ORDER BY wins DESC, draws DESC, games_played ASC
     LIMIT :limit`,
    { limit }
  );
  return rows.map((row, i) => ({ ...toStats(row), rank: i + 1 }));
}
