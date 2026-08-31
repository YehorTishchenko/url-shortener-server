# url-shortener-backend

Backend for a URL shortener. Currently a bare skeleton.

## Setup

```bash
npm install
cp .env.example .env   # then fill in REDIS_PASSWORD
```

## Run locally

Requires a Redis instance reachable at `REDIS_URL` and a Postgres instance reachable at `DATABASE_URL` (see `.env.example`).

```bash
npm run dev     # node --watch, restarts on file changes
npm start       # single run
```

## Run with Docker Compose

```bash
docker compose up --build
```

Compose reads `REDIS_PASSWORD`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` from a root `.env` file — create one from `.env.example` first.

`docker compose up` does **not** run database migrations automatically. After the `db` service is up, apply migrations from the host with:

```bash
npm run db:migrate
```

## Testing

```bash
npm test         # vitest run, single pass
npm run test:watch  # vitest, watch mode
```

Tests import `src/app.ts` (the Fastify instance + routes) and exercise it directly via Fastify's `.inject()` — no live server, Redis, or Postgres needed. `src/server.ts` is a thin wrapper around `app.ts` that adds the real process concerns (connecting to Redis/Postgres, `.listen()`, graceful shutdown) and is not imported by tests.

## Other scripts

```bash
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run db:generate  # generate a migration from schema.ts changes
npm run db:migrate   # apply pending migrations
```
