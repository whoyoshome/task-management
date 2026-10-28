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
| `REFRESH_COOKIE_SECURE` | `true` (default). The refresh cookie is `SameSite=Strict`, so the frontend and the API must share a site, e.g. `your-domain.com` and `api.your-domain.com` |

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

## Free public demo (Render + Neon + Vercel)

A zero-cost live demo. Running one service per container on managed
platforms costs about 7 USD per service per month, so the demo trades that
for a single container:

```
browser ──► https://<app>.vercel.app
             ├─ /        → the SPA (Vercel)
             └─ /api/*   → rewrite → https://<api>.onrender.com
                                       └─ one container (Render, free)
                                          ├─ api-gateway on $PORT
                                          └─ 3 microservices on 127.0.0.1
                                                └──► Neon Postgres (TLS)
```

- `docker/demo/Dockerfile` builds the four apps into one image; `start.js`
  starts the microservices on loopback (their TCP commands are not
  authenticated), then the gateway, and stops everything if one exits.
  It fits a 512 MB instance (about 220 MB in use).
- Vercel proxies `/api` to Render, so the browser only talks to the Vercel
  domain and the `SameSite=Strict` refresh cookie stays first-party.
- `DATABASE_URL` (Neon's connection string) is expanded into the
  `<SERVICE>_DB_*` variables by `docker/demo/database-url.js`; `DB_SSL=true`
  encrypts the connection and verifies the certificate.

### Steps

1. **Neon**: create a project. In the SQL editor, run
   `docker/postgres/init/01-schemas.sql`. Copy the **direct** (not pooled)
   connection string.
2. **Render**: New → Blueprint → this repository (`render.yaml`). Set
   `DATABASE_URL` and, once Vercel gives you the URL, `FRONTEND_API_URL`
   (e.g. `https://task-management.vercel.app`; `*` wildcards allowed for
   preview deployments). The JWT secrets are generated by Render.
3. **Vercel**: import the repository; `vercel.json` sets the build. If the
   Render service URL is not `task-management-api.onrender.com`, update the
   `/api` rewrite in `vercel.json`.
4. **Seed** once, from your machine. Create `.env.neon` (ignored by git):

   ```env
   DATABASE_URL=postgresql://...      # Neon direct connection string
   DB_SSL=true
   USER_DB_SCHEMA=users
   TASK_DB_SCHEMA=tasks
   AUTH_DB_SCHEMA=auths
   SEED_ADMIN_PASSWORD=<a private password>
   SEED_MEMBER_PASSWORD=<a private password>
   ```

   ```bash
   docker run --rm --env-file .env.neon -e NODE_OPTIONS=--require=./docker/demo/database-url.js -v "${PWD}:/app" -w /app node:24 sh -c "npm ci && npm run seed:all"
   ```

   Visitors log in as `demo@example.com` / `Password123!`, a regular
   project member; the login page shows it (`VITE_DEMO_*` in `vercel.json`).

### Limits

- Render's free instance sleeps after 15 minutes idle; the first request
  takes 30–60 s. The login page pings the API on load and says so.
- Visitors can change the demo data. To reset it, empty the `tasks` schema
  tables in Neon and run the seed again.
- `TRUST_PROXY=1` trusts only Render's proxy. The Render URL is also
  reachable directly, so trusting Vercel's hop too would let anyone set
  their IP through `X-Forwarded-For` and bypass the login rate limit; the
  cost is that, through Vercel, the limit is shared per Vercel edge address.
- Vercel's Deployment Protection puts preview and branch URLs behind a
  Vercel login. Share the production domain (deployed from the production
  branch), and keep its protection at "Standard" so it stays public.

## Screenshots for README

After deploy (or locally), capture:

1. Login page
2. Home dashboard
3. Project kanban board
4. Task detail panel with comments and labels

Store under `docs/screenshots/` and reference them in the README.
