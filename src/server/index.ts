import http from "node:http";

console.log(
  `[chess] starting server in ${process.env.NODE_ENV || "development"} mode…`,
);

// Load .env (Node 22 built-in) if present — no dependency, no committed secrets.
try {
  process.loadEnvFile();
} catch {
  // No .env file; rely on real environment variables / dev defaults.
}

const { config } = await import("./config");
const { createApp } = await import("./http");
const { ensureSchema } = await import("./db/schema");
const { pingDb, getPool } = await import("./db/pool");
const { createSocketServer } = await import("./realtime/io");

async function main() {
  // Database: verify connectivity and ensure tables exist.
  try {
    await pingDb();
    await ensureSchema();
    console.log("[chess] database ready");
  } catch (err) {
    console.error(
      "[chess] DATABASE UNAVAILABLE — check your .env / MySQL credentials.",
    );
    console.error(err);
    process.exit(1);
  }

  const app = await createApp();
  const server = http.createServer(app);
  const io = createSocketServer(server);

  server.listen(config.port, () => {
    console.log(`[chess] listening on http://localhost:${config.port}`);
  });

  // Graceful shutdown: close sockets, HTTP and the DB pool so the process exits
  // promptly (no "hasn't exited yet" force-kill from tsx / no hang under PM2).
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n[chess] ${signal} received, shutting down…`);
    const forced = setTimeout(() => process.exit(0), 3000);
    forced.unref();
    try {
      await io.close();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await getPool().end();
    } catch {
      /* ignore errors during shutdown */
    }
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[chess] fatal startup error:", err);
  process.exit(1);
});
