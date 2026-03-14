# Pesto

Pesto is a self-hosted pastebin built with Next.js, Auth.js, Drizzle ORM, and PostgreSQL.

## Features

- Browser-based setup wizard for first-time installation
- Credentials auth with optional GitHub and Google OAuth
- Admin dashboard for registrations, users, and provider toggles
- Markdown rendering and syntax-highlighted code pastes
- Password-protected and burn-after-reading pastes
- Optional Upstash Redis rate limiting with in-memory fallback

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16, React 19 |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Auth.js v5 |
| Editor | CodeMirror 6 |
| Highlighting | Shiki |
| Styling | Tailwind CSS v4 |

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/yourusername/pesto.git
cd pesto
npm install
```

### 2. Start first-run setup mode

```bash
npm run setup
```

This command starts the app with `SETUP_MODE=true`. That is required for `/setup` and `/api/setup/*`.

### 3. Open the setup wizard

Visit `http://localhost:3000/setup`.

The wizard performs these steps:

1. Tests your PostgreSQL connection string
2. Writes `DATABASE_URL` and `AUTH_SECRET` to `.env.local`
3. Pushes the Drizzle schema into the database
4. Creates the first admin account
5. Optionally writes OAuth credentials to `.env.local`

### 4. Exit setup mode

After the wizard finishes:

```bash
Ctrl+C
npm run dev
```

`npm run dev` runs the app normally without `SETUP_MODE=true`. Do not keep setup mode enabled for normal operation.

### 5. Sign in as admin

Open `http://localhost:3000/login` and sign in with the admin account created during setup.

## Setup Security

Setup access is intentionally restricted.

- `/setup` and `/api/setup/*` only work when `SETUP_MODE=true`
- While setup mode is enabled, setup routes are also restricted to `localhost` or private-network addresses by default
- Forwarded proxy headers are ignored unless `SETUP_TRUST_PROXY=true`
- If you intentionally need remote setup behind your own controls, set `SETUP_ALLOW_REMOTE=true`
- After setup is completed, setup stays closed unless `SETUP_REOPEN=true` is explicitly set

That means a fresh install should be started with `npm run setup`, not `npm run dev`.

## Normal Development

After initial setup:

```bash
npm run dev
```

If `.env.local` already contains a valid `DATABASE_URL`, the app starts normally and the setup wizard stays unavailable.

## Production Start

Build and run after setup has already been completed:

```bash
npm run build
npm start
```

Production should not be started with `SETUP_MODE=true` unless an administrator is intentionally performing a controlled setup window.

## Docker

For first boot, run the container with `SETUP_MODE=true`, complete the wizard, then restart without it.

Example:

```bash
docker build -t pesto .
docker run --rm -it -p 3000:3000 -e SETUP_MODE=true -v ${PWD}/.env.local:/app/.env.local pesto
```

Complete setup at `http://localhost:3000/setup`, stop the container, then run it again without `SETUP_MODE=true`.

See [WIKI.md](/E:/Pesto/WIKI.md) and [SETUP.md](/E:/Pesto/SETUP.md) for full operational guidance.

## Environment Variables

### Required after setup

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Session/auth secret |

### Optional application variables

| Variable | Purpose |
| --- | --- |
| `AUTH_GITHUB_ID` | GitHub OAuth client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth client secret |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |
| `CRON_SECRET` | Secret for `/api/cron/cleanup` |

### Setup-only variables

| Variable | Purpose |
| --- | --- |
| `SETUP_MODE` | Enables the setup wizard and setup API routes |
| `SETUP_TRUST_PROXY` | Trusts `X-Forwarded-*` headers when evaluating setup access |
| `SETUP_ALLOW_REMOTE` | Overrides the default local/private-network-only setup restriction |
| `SETUP_REOPEN` | Reopens setup after completion for deliberate maintenance or recovery |

## Documentation

- [SETUP.md](/E:/Pesto/SETUP.md): detailed installation and setup operations
- [WIKI.md](/E:/Pesto/WIKI.md): deployment, Docker, operations, and troubleshooting

## License

MIT
