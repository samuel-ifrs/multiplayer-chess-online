import { getPool } from './pool';

// Idempotent schema bootstrap. Run once on server start.
export async function ensureSchema(): Promise<void> {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (
      id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
      username     VARCHAR(32)  NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      wins         INT UNSIGNED NOT NULL DEFAULT 0,
      losses       INT UNSIGNED NOT NULL DEFAULT 0,
      draws        INT UNSIGNED NOT NULL DEFAULT 0,
      games_played INT UNSIGNED NOT NULL DEFAULT 0,
      created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_username (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS games (
      id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
      white_id     INT UNSIGNED NULL,
      black_id     INT UNSIGNED NULL,
      white_name   VARCHAR(32)  NOT NULL,
      black_name   VARCHAR(32)  NOT NULL,
      result       ENUM('white','black','draw') NOT NULL,
      reason       VARCHAR(32)  NOT NULL,
      time_control VARCHAR(8)   NOT NULL,
      moves_count  INT UNSIGNED NOT NULL DEFAULT 0,
      pgn          TEXT         NOT NULL,
      started_at   DATETIME     NULL,
      ended_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_white (white_id),
      KEY idx_black (black_id),
      KEY idx_ended (ended_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}
