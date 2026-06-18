# Brewer

Brewer is a personal coffee journal for tracking beans, brew recipes, tasting notes, and reusable templates. You can log individual brews, compare methods over time, and save recipe starting points.

## What the App Does

- Create an account and sign in
- Save beans, brews, and recipe templates per user
- Log brews with dose, water, grind, timing, and tasting details
- Reuse or edit templates as starting points for future brews
- View brew history, bean records, and simple insights

## Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js HTTP server
- Database: PostgreSQL

## Local Development

You need a Postgres database available through `DATABASE_URL`.

1. Copy `.env.example` to `.env` and adjust it if needed.
2. Start Postgres.
3. Run the backend and frontend:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restart-dev.ps1
```

That script restarts both dev servers:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Docker Compose

The included Compose file starts both the app and Postgres:

```powershell
docker compose up -d --build
```

The app will be available on:

- `http://localhost:8082`

Postgres data is stored in the `brewer-postgres-data` Docker volume.

## Railway

This app now expects a Postgres database instead of `.data/db.json`.

In Railway:

1. Create a Postgres service.
2. Add `DATABASE_URL` from that Postgres service to the app service.
3. Deploy the app service from this repo.

The app container:

- builds the Vite frontend into `dist/`
- serves the built frontend from `server.mjs`
- creates its database tables automatically on startup

## Portainer / Raspberry Pi Deployment

For Portainer on your Pi host:

1. Deploy this repo as a stack.
2. Use the included `docker-compose.yml`.
3. Keep both services: `brewer` and `postgres`.
4. Publish container port `3001` to the host port you want, currently `8082:3001`.
5. Persist the Postgres volume so user data survives restarts.

## Production Notes

- `DATABASE_URL` is required.
- The `/health` endpoint checks database connectivity.
- New users get seeded default templates on first registration.
