# Deployment Guide

Deploy only after local tests pass and demo data works with `npm run docker:up`.

## Recommended: VPS + Docker Compose

Best fit for this architecture (5 services + PostgreSQL) at low cost (~5–10 EUR/month).

### 1. Provision server

- Ubuntu 22.04+ on Hetzner, DigitalOcean, or similar
- Open ports: 80, 443 (and optionally 22 for SSH)

### 2. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 3. Clone and configure

```bash
git clone <your-repo-url> task-management
cd task-management
cp .env.example .env
```

Generate production secrets:

```bash
openssl rand -hex 32   # JWT_SECRET
openssl rand -hex 32   # JWT_REFRESH_SECRET
openssl rand -hex 24   # POSTGRES_PASSWORD
```

Update `.env`:

| Variable | Production value |
|----------|------------------|
| `JWT_SECRET` | generated secret |
| `JWT_REFRESH_SECRET` | generated secret |
| `POSTGRES_PASSWORD` | generated secret, required by `docker-compose.prod.yml` |
| `USER_DB_PASSWORD`, `TASK_DB_PASSWORD`, `AUTH_DB_PASSWORD` | same value as `POSTGRES_PASSWORD` |
| `FRONTEND_API_URL` | `https://your-domain.com` (comma-separated; `*` wildcards allowed). Required: if empty, browser cross-origin requests are rejected |
| `TRUST_PROXY` | `1` when the gateway runs behind one reverse proxy, so rate limiting sees the real client IP |
| `VITE_API_URL` | `https://api.your-domain.com/api/v1` (build-time) |

### 4. Migrations

Each microservice runs its pending migrations on startup, so a fresh database
needs no manual step. Do not set `DB_SYNCHRONIZE` in production.

**Databases created before migrations existed** (tables made by
`synchronize`): the initial `InitSchema` migration would fail with "relation
already exists". Mark it as applied once per schema instead of running it:

```sql
CREATE TABLE IF NOT EXISTS users.migrations (id SERIAL PRIMARY KEY, "timestamp" bigint NOT NULL, name varchar NOT NULL);
INSERT INTO users.migrations ("timestamp", name) VALUES (1793153565028, 'InitSchema1793153565028');

CREATE TABLE IF NOT EXISTS tasks.migrations (id SERIAL PRIMARY KEY, "timestamp" bigint NOT NULL, name varchar NOT NULL);
INSERT INTO tasks.migrations ("timestamp", name) VALUES (1793153567713, 'InitSchema1793153567713');

CREATE TABLE IF NOT EXISTS auths.migrations (id SERIAL PRIMARY KEY, "timestamp" bigint NOT NULL, name varchar NOT NULL);
INSERT INTO auths.migrations ("timestamp", name) VALUES (1793153570821, 'InitSchema1793153570821');
```

### 5. Build and start

```bash
npm run docker:up:prod
npm run seed:all
```

### 6. Reverse proxy + HTTPS (Caddy example)

```caddy
your-domain.com {
  reverse_proxy localhost:5173
}

api.your-domain.com {
  reverse_proxy localhost:3000
}
```

Rebuild the client image with production `VITE_API_URL` before exposing publicly.

### 7. Post-deploy checklist

- [ ] Health check: `GET /api/v1/health`
- [ ] Login with demo credentials works
- [ ] CORS allows your frontend domain
- [ ] Swagger restricted or disabled in production
- [ ] Strong secrets (not `.env.example` values)
- [ ] README updated with live URL

## Alternative: Hybrid deploy

| Component | Platform |
|-----------|----------|
| Frontend (static) | Vercel / Netlify / Cloudflare Pages |
| Backend + DB | VPS with Docker Compose |

Build frontend with:

```bash
VITE_API_URL=https://api.your-domain.com/api/v1 npm run build
```

## Alternative: Railway / Render

Possible but expensive for 4+ NestJS services. Prefer a single VPS unless you need managed ops and accept higher monthly cost.

## Screenshots for README

After deploy (or locally), capture:

1. Login page
2. Home dashboard
3. Project kanban board
4. Task detail panel with comments and labels

Store under `docs/screenshots/` and reference them in the README.
