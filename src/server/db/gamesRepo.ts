import type { RowDataPacket } from 'mysql2'
import { getPool } from './pool'
import type { GameHistoryEntry, GameReason, GameResult } from '../../shared/types'
import type { TimeControlId } from '../../shared/timeControls'

export interface RecordGameParams {
  whiteId: number | null
  blackId: number | null
  whiteName: string
  blackName: string
  result: GameResult
  reason: GameReason
  timeControl: TimeControlId
  movesCount: number
  pgn: string
  startedAt: Date | null
}

/**
 * Persist a finished game and update both players' aggregate counters in a single
 * transaction so the leaderboard never drifts from the game log.
 */
export async function recordGame(params: RecordGameParams): Promise<void> {
  const dbResult = params.result === 'draw' ? 'draw' : params.result === 'w' ? 'white' : 'black'
  const conn = await getPool().getConnection()
  try {
    await conn.beginTransaction()

    await conn.query(
      `INSERT INTO games
        (white_id, black_id, white_name, black_name, result, reason, time_control, moves_count, pgn, started_at)
       VALUES
        (:whiteId, :blackId, :whiteName, :blackName, :result, :reason, :timeControl, :movesCount, :pgn, :startedAt)`,
      {
        whiteId: params.whiteId,
        blackId: params.blackId,
        whiteName: params.whiteName,
        blackName: params.blackName,
        result: dbResult,
        reason: params.reason,
        timeControl: params.timeControl,
        movesCount: params.movesCount,
        pgn: params.pgn,
        startedAt: params.startedAt,
      },
    )

    const bump = async (id: number | null, field: 'wins' | 'losses' | 'draws') => {
      if (id == null) return
      await conn.query(
        `UPDATE players SET ${field} = ${field} + 1, games_played = games_played + 1 WHERE id = :id`,
        { id },
      )
    }

    if (params.result === 'draw') {
      await bump(params.whiteId, 'draws')
      await bump(params.blackId, 'draws')
    } else if (params.result === 'w') {
      await bump(params.whiteId, 'wins')
      await bump(params.blackId, 'losses')
    } else {
      await bump(params.blackId, 'wins')
      await bump(params.whiteId, 'losses')
    }

    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export async function getPlayerGames(username: string, limit = 30): Promise<GameHistoryEntry[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    `SELECT id, white_name, black_name, result, reason, time_control, moves_count, pgn, ended_at
     FROM games
     WHERE white_name = :username OR black_name = :username
     ORDER BY ended_at DESC
     LIMIT :limit`,
    { username, limit },
  )
  return rows.map((r) => ({
    id: Number(r.id),
    whiteName: r.white_name,
    blackName: r.black_name,
    result: r.result === 'white' ? 'w' : r.result === 'black' ? 'b' : 'draw',
    reason: r.reason as GameReason,
    timeControl: r.time_control as TimeControlId,
    movesCount: Number(r.moves_count),
    pgn: r.pgn,
    endedAt: new Date(r.ended_at).toISOString(),
  }))
}
