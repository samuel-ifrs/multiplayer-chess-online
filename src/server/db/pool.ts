import mysql from 'mysql2/promise';
import { config } from '../config';

// Shared connection pool. Created lazily so the process can boot even while we
// validate the connection (and so tests can import without connecting).
let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      charset: 'utf8mb4',
      namedPlaceholders: true
    });
  }
  return pool;
}

export async function pingDb(): Promise<void> {
  const conn = await getPool().getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}
