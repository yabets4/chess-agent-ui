# Chess

A chess game built with Vite + React + Tailwind CSS v4 that you can play against
a self-trained AI model, a minimax engine, or against a friend on the same device.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

During development the model API (running at `http://localhost:8001`) is reached
through a Vite proxy, so no configuration is needed. Start the backend first with
`python server.py` from the chess-rl project.

## Play

- Click a piece to select it (legal destinations are dotted). Click a destination
  to move. Promotion shows a piece chooser. "New Game" resets.
- **Game Modes**: Pass & Play (same device), Player vs Model, Player vs Minimax,
  and Self-play (watch the model play itself).
- **Rules**: full chess rules — all piece moves, check, checkmate, stalemate,
  castling, en passant, pawn promotion, and insufficient material draws.

## Connecting to a deployed model backend

The API base URL is configurable at build time:

- **Unset (default)**: requests go to relative `/api/...` — correct when the
  frontend is served from the same origin as the backend, or in dev via the proxy.
- **Set `VITE_API_URL`**: requests go to that server, e.g. when the UI is hosted
  separately from the model backend:

```bash
VITE_API_URL=https://your-backend.onrender.com npm run build
```

Required env vars are not baked in — set `VITE_API_URL` at build time (Vercel /
Netlify project settings → Environment Variables).

## Deploy

Static site (any host, e.g. Vercel/Netlify):

```bash
npm run build   # outputs to dist/
```

Serve the `dist/` folder. If you want a single URL for everything, place this
build output into the `chess-rl` backend repo's `dist/` folder — the backend
serves both the UI and the `/api/*` endpoints from one service.