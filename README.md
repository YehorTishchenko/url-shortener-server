# url-shortener-backend

Backend for a URL shortener. Currently a bare skeleton.

## Setup

```bash
npm install
cp .env.example .env   # then fill in REDIS_PASSWORD
```

## Run locally

Requires a Redis instance reachable at `REDIS_URL` (see `.env.example`).

```bash
npm run dev     # node --watch, restarts on file changes
npm start       # single run
```

## Run with Docker Compose

```bash
docker compose up --build
```

Compose reads `REDIS_PASSWORD` from a root `.env` file — create one from `.env.example` first.

## Other scripts

```bash
npm run lint        # eslint
npm run typecheck    # tsc --noEmit
```
