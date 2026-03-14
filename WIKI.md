# Pesto Wiki

This document covers operational deployment, admin setup flow, Docker usage, and troubleshooting.

For a step-by-step first-install guide, see [SETUP.md](/E:/Pesto/SETUP.md).

## Operational Model

Pesto has two distinct runtime modes:

1. Setup mode
   Run with `SETUP_MODE=true` so an administrator can access `/setup` exactly long enough to initialize the instance.
2. Normal mode
   Run without `SETUP_MODE=true` for day-to-day use.

These modes are intentionally separate. The setup wizard is not part of normal app usage.

## Admin-Only Setup Sequence

Use this sequence for every fresh deployment:

1. Start the app in setup mode.
2. Open `/setup` as an administrator.
3. Configure database access, push schema, and create the first admin user.
4. Stop the app.
5. Remove `SETUP_MODE=true`.
6. Start the app normally.
7. Sign in through `/login` and manage the instance from `/admin`.

If you skip step 5 and leave setup mode enabled, the setup surface remains available. The app now restricts setup access to localhost or private-network addresses by default, but normal operation should still run with setup mode disabled.

## Local Deployment

### First boot

```bash
git clone https://github.com/yourusername/pesto.git
cd pesto
npm install
npm run setup
```

Then open `http://localhost:3000/setup`.

The setup wizard will:

- test the PostgreSQL connection
- write `DATABASE_URL` and `AUTH_SECRET` to `.env.local`
- push the database schema
- create or promote the first admin account
- optionally write OAuth client credentials

### After setup completes

Stop the setup server and restart normally:

```bash
Ctrl+C
npm run dev
```

At this point:

- `/setup` should no longer be used
- `/login` is the correct entry point
- `/admin` becomes the control plane for the instance

## Production Deployment

Production setup should be handled as a short, controlled administrative window.

Recommended pattern:

1. Deploy the app with `SETUP_MODE=true`
2. Keep the instance reachable only from trusted hosts or a private network
3. Complete `/setup`
4. Restart the process without `SETUP_MODE=true`
5. Expose the normal application

Do not treat setup mode as a permanent production flag.

## Setup Route Hardening

Setup routes are protected by two layers:

1. `SETUP_MODE=true` must be present
2. Requests must originate from localhost or a private-network address by default
3. Once setup has been completed, setup routes stay closed unless `SETUP_REOPEN=true`

Covered routes:

- `/setup`
- `/api/setup/test-db`
- `/api/setup/push-schema`
- `/api/setup/complete`

### Remote setup override

If you intentionally need remote setup, you can set:

```env
SETUP_ALLOW_REMOTE=true
```

Only use this behind controls you trust, such as:

- VPN-only access
- a temporary reverse proxy allowlist
- a private admin subnet
- a one-time maintenance window

### Proxy trust

Forwarded headers such as `X-Forwarded-For` and `X-Forwarded-Host` are ignored by default during setup access checks.

If Pesto is behind a trusted reverse proxy and you want setup access decisions to use those forwarded values, set:

```env
SETUP_TRUST_PROXY=true
```

Only enable this if the proxy is authoritative for those headers.

### Reopening setup after completion

After `app_settings.setup_completed` is set, setup routes are denied even if `SETUP_MODE=true` remains present.

To deliberately reopen setup for recovery or maintenance, set:

```env
SETUP_REOPEN=true
```

This should be temporary and operator-controlled.

## Environment File Behavior

The setup flow writes to `.env.local`.

What the wizard writes automatically:

- `DATABASE_URL`
- `AUTH_SECRET`
- optional GitHub OAuth credentials
- optional Google OAuth credentials

What it does not do automatically:

- disable `SETUP_MODE`
- set `SETUP_REOPEN`
- restart the process
- configure your reverse proxy or TLS
- provision PostgreSQL itself

That shutdown and restart boundary is intentional. Environment values written during setup should be followed by a controlled restart into normal mode.

## Docker

### First-run container flow

Run with `SETUP_MODE=true` only for initialization:

```bash
docker build -t pesto .
docker run --rm -it ^
  -p 3000:3000 ^
  -e SETUP_MODE=true ^
  -v ${PWD}\.env.local:/app/.env.local ^
  -v ${PWD}\attachments:/app/public/attachments ^
  pesto
```

Complete setup at `http://localhost:3000/setup`, stop the container, then start a normal container without `SETUP_MODE=true`.

### Docker Compose example

```yaml
services:
  pesto:
    build: .
    ports:
      - "3000:3000"
    environment:
      SETUP_MODE: "true"
    volumes:
      - ./.env.local:/app/.env.local
      - ./attachments:/app/public/attachments
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: pesto
      POSTGRES_PASSWORD: change_me
      POSTGRES_DB: pesto
    volumes:
      - pesto_data:/var/lib/postgresql/data

volumes:
  pesto_data:
```

After setup, change the Compose environment so `SETUP_MODE` is removed, then recreate the `pesto` service.

## Manual Configuration

If you do not want to use the wizard, create `.env.local` manually:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pesto"
AUTH_SECRET="replace-with-a-random-secret"

# Optional
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
UPSTASH_REDIS_REST_URL="" # Optional shared paste-create rate limiting
UPSTASH_REDIS_REST_TOKEN="" # Optional shared paste-create rate limiting
CRON_SECRET=""
```

Push the schema:

```bash
npx drizzle-kit push
```

Then start normally:

```bash
npm run build
npm start
```

To create an admin manually, first register through the app and then promote that user in PostgreSQL.

## Admin Operations

Once setup is complete, `/admin` is where operators should manage the instance.

Available controls include:

- registration toggle
- GitHub login enable/disable
- Google login enable/disable
- user moderation and role changes
- global paste management

## Storage Notes

Uploaded attachments are stored in `public/attachments`.

In containers or hosted deployments, mount that path to persistent storage or uploads will be lost on replacement or rebuild.

## Cleanup Job

If you enable scheduled cleanup, set `CRON_SECRET` and call the cleanup endpoint with bearer auth:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/cleanup
```

Example cron:

```bash
0 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/cleanup
```

## Troubleshooting

| Symptom | Likely Cause | Action |
| --- | --- | --- |
| `/setup` redirects away immediately | App started without setup mode | Start with `npm run setup` or `SETUP_MODE=true` |
| `/setup` returns 403 during setup mode | Request is coming from a public host or public client IP | Use localhost/private-network access or explicitly set `SETUP_ALLOW_REMOTE=true` |
| `/setup` redirects to `/login` even with setup mode enabled | Setup was already completed | Leave setup closed, or set `SETUP_REOPEN=true` for a deliberate maintenance window |
| App returns 503 saying database is not configured | No `DATABASE_URL` and setup mode is disabled | Run the setup flow or create `.env.local` manually |
| OAuth buttons do not appear | Provider disabled in admin settings or credentials missing | Check `/admin` and verify env values |
| Schema push fails | DB is unreachable or credentials are wrong | Re-test the connection string and verify PostgreSQL availability |
| Uploads disappear after restart | Attachment storage is not persistent | Mount `public/attachments` to persistent storage |
