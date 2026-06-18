# Brewer

Brewer is a personal coffee journal for tracking beans, brew recipes, tasting notes, and reusable templates. You can log individual brews, compare methods over time, and save recipe starting points.

## What the App Does

- Create an account and sign in
- Save beans, brews, and recipe templates per user
- Log brews with dose, water, grind, timing, and tasting details
- Reuse or edit templates as starting points for future brews
- View brew history, bean records, and simple insights

## Local Development

Run the backend and frontend together with:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restart-dev.ps1
```

That script restarts both dev servers:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Container Deployment

This project is now a single Node-based container:

- Vite builds the frontend into `dist/`
- `server.mjs` serves the built frontend and the backend API
- user accounts and app data are stored in `/app/.data/db.json`

### Docker Compose

```powershell
docker compose up -d --build
```

The app will be available on:

- `http://localhost:8082`

### Persistent Data

The Compose file mounts a persistent volume at `/app/.data`, which stores:

- registered users
- login sessions
- saved beans, brews, and templates

### Portainer / Raspberry Pi Deployment

For Portainer on your Synology-managed Pi host:

1. Deploy this repo as a stack.
2. Use the included `docker-compose.yml`.
3. Keep the persistent volume for `/app/.data`.
4. Publish container port `3001` to the host port you want, currently `8082:3001`.
5. Put your reverse proxy in front of the published port if you want HTTPS or a custom hostname.

### Production Run Without Compose

```powershell
docker build -t brewer .
docker run -d --name brewer -p 8082:3001 -v brewer-data:/app/.data --restart unless-stopped brewer
```
