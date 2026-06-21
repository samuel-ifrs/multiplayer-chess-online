# ♟ Multiplayer Chess Online

Real-time multiplayer chess: create public or private (password) rooms, pick your color
(white / black / random), play with clocks, chat with your opponent, and climb a global
leaderboard. Built with **React SSR + Express + Socket.IO + MySQL** in TypeScript.

## Features

- **Accounts** — register/log in with a username + password (sessions via httpOnly JWT cookie).
- **Lobby** — list open public rooms, create public or password-protected rooms.
- **Full chess rules** via `chess.js`: legal moves, castling, en passant, promotion, check,
  checkmate, stalemate, threefold repetition, fifty-move rule, insufficient material.
- **Clocks**: `1+1`, `3+0`, `3+1`, `10+0`, `10+5`, `15+0`, and `∞` (untimed). Server-authoritative.
- **In-game**: resign, offer/accept/decline draws, live chat, move list, captured pieces.
- **Disconnect handling**: a dropped player has 30s to return (clock keeps running); otherwise the
  opponent wins by abandonment. If both players drop, the room is deleted.
- **Persistence (MySQL)**: global leaderboard, per-player stats (W/L/D, win-rate), match history (PGN).
- **i18n**: English by default, one-click Português toggle.
- **Custom SVG piece set** and a polished responsive UI.

## Requirements

- Node.js **22+**
- A **MySQL** database

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root (copy this):
   ```ini
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=replace-with-a-long-random-string
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=chess
   DB_PASSWORD=chess
   DB_NAME=chess
   ```
   The server creates its tables automatically on first start.
3. Run in development (Vite SSR + HMR):
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

### Local MySQL via Docker (optional)

```bash
docker run --name chess-mysql -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=chess -e MYSQL_USER=chess -e MYSQL_PASSWORD=chess \
  -p 3306:3306 -d mysql:8
```

## Production build & run

```bash
npm run build   # builds the client bundle + the SSR entry into dist/
npm start       # NODE_ENV=production, serves dist/client + SSR, single process
```

## Deploying to Hostinger (Business plan)

The app is a single long-lived Node process with in-memory room state — run **exactly one
instance** (no clustering).

1. In hPanel, create a **MySQL database** and note the host/user/password/name.
2. Create a **Node.js web app** from this GitHub repo. Choose **Node 22**.
3. Set the **build command** to `npm ci && npm run build` and the **start command** to `npm start`.
4. Configure environment variables: `JWT_SECRET`, `NODE_ENV=production`, and the `DB_*` values.
5. Deploy. Hostinger's proxy handles the WebSocket upgrade; the client connects same-origin.

If you ever outgrow the managed Node app, move to a Hostinger **KVM VPS** with PM2
(`instances: 1`, fork mode) behind Nginx with the WebSocket `Upgrade`/`Connection` headers set.

## Project layout

```
src/shared    Framework-free contract: socket events, types, time controls
src/server    Express + Vite SSR + Socket.IO, domain (Game/Clock/Room), MySQL repos, auth
src/client    React app: SSR entries, router, i18n, auth, pages, board + custom SVG pieces
```
