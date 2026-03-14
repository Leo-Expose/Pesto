# Pesto Setup Guide

This is the full installation and first-run guide for Pesto.

## What Setup Actually Does

Pesto does not allow `/setup` during a normal `npm run dev` or `npm start` session unless setup mode is explicitly enabled.

The intended first-run flow is:

1. Start the app in setup mode
2. Open the setup wizard
3. Write initial secrets and database config
4. Create the schema
5. Create the first admin account
6. Stop setup mode
7. Restart in normal mode

This separation prevents the setup wizard from staying available during ordinary operation.

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL 14 or newer
- Optional: Upstash Redis for shared paste-create rate limiting across instances

## First-Time Local Install

### 1. Install dependencies

```bash
git clone https://github.com/yourusername/pesto.git
cd pesto
npm install
```

### 2. Start setup mode

```bash
npm run setup
```

This is equivalent to starting the app with `SETUP_MODE=true`.

### 3. Open the wizard

Navigate to:

```text
http://localhost:3000/setup
```

### 4. Complete the wizard

#### Step 1: Database

Enter a PostgreSQL connection string such as:

```text
postgresql://user:password@localhost:5432/pesto
```

Use the Test Connection action first. Do not continue until the connection succeeds.

#### Step 2: Schema

The app writes `DATABASE_URL` and `AUTH_SECRET` into `.env.local`, then runs the Drizzle schema push.

Tables created or updated include:

- `user`
- `account`
- `session`
- `verificationToken`
- `pastes`
- `app_settings`

#### Step 3: Admin

Create the first administrator account. If the email already exists, setup promotes that account to admin and updates its password.

#### Step 4: OAuth

This step is optional. GitHub and Google credentials can be supplied now or later.

If OAuth credentials are written during setup, restart the app afterward so the new environment values are loaded everywhere.

## After the Wizard Finishes

Stop the running setup process:

```bash
Ctrl+C
```

Restart normally:

```bash
npm run dev
```

Then sign in at:

```text
http://localhost:3000/login
```

From that point on, `/admin` is the place to manage the instance.

## Security Model During Setup

Setup mode is intentionally constrained.

### Default protections

- `/setup` is unavailable unless `SETUP_MODE=true`
- setup API routes are unavailable unless `SETUP_MODE=true`
- even in setup mode, requests are only allowed from localhost or private-network addresses by default
- forwarded proxy headers are ignored unless `SETUP_TRUST_PROXY=true`
- once setup has completed, setup is closed again unless `SETUP_REOPEN=true`

This helps prevent accidental exposure if someone boots an instance with setup mode enabled on a public interface.

### Deliberate remote setup

If you intentionally need to complete setup remotely, set:

```env
SETUP_ALLOW_REMOTE=true
```

Only do this for a controlled administrative window. Remove it afterward.

If the instance is behind a trusted reverse proxy and setup access should evaluate forwarded client information, also set:

```env
SETUP_TRUST_PROXY=true
```

Only enable that when the proxy owns and sanitizes those headers.

If you intentionally need to reopen setup after completion for maintenance or recovery, set:

```env
SETUP_REOPEN=true
```

This is separate from `SETUP_MODE=true`. Both are required to reopen setup after the instance has already been initialized.

## Environment Variables

### Automatically written by setup

- `DATABASE_URL`
- `AUTH_SECRET`
- optional `AUTH_GITHUB_ID`
- optional `AUTH_GITHUB_SECRET`
- optional `AUTH_GOOGLE_ID`
- optional `AUTH_GOOGLE_SECRET`

### Not written by setup

- `SETUP_MODE`
- `SETUP_TRUST_PROXY`
- `SETUP_ALLOW_REMOTE`
- `SETUP_REOPEN`
- `UPSTASH_REDIS_REST_URL` for shared paste-create rate limiting
- `UPSTASH_REDIS_REST_TOKEN` for shared paste-create rate limiting
- `CRON_SECRET`

## Production Setup Procedure

Use this sequence:

1. Deploy the app with `SETUP_MODE=true`
2. Restrict access to trusted administrators only
3. Complete `/setup`
4. Stop the process
5. Remove `SETUP_MODE=true`
6. Start the app normally
7. Verify `/setup` is no longer reachable
8. Hand off normal operation to `/admin`

## Docker Setup Procedure

### Temporary setup container

```bash
docker build -t pesto .
docker run --rm -it -p 3000:3000 -e SETUP_MODE=true -v ${PWD}/.env.local:/app/.env.local pesto
```

Complete the browser setup, stop the container, then relaunch without `SETUP_MODE=true`.

### Persistent uploads

If you use attachments, also mount:

```text
/app/public/attachments
```

## Manual Setup Alternative

If you prefer not to use the wizard:

1. Create `.env.local`
2. Set `DATABASE_URL` and `AUTH_SECRET`
3. Run `npx drizzle-kit push`
4. Start the app
5. Create a user and promote it to admin in PostgreSQL

The wizard is still the intended path for most installs.

## Verification Checklist

After setup is complete:

- `.env.local` exists
- `DATABASE_URL` is present
- `AUTH_SECRET` is present
- database tables exist
- admin user can sign in
- `/admin` loads for that user
- `/setup` is no longer reachable in normal mode

## Common Mistakes

- Starting with `npm run dev` on a fresh clone and expecting `/setup` to work
- Leaving `SETUP_MODE=true` enabled after the first admin is created
- Exposing setup mode publicly without additional network controls
- Forgetting to restart after writing new OAuth credentials
