# Self-Hosting Pesto — Detailed Guide

Pesto is designed to be **fully self-hostable** with zero cloud lock-in. Connect to any PostgreSQL database, configure everything from a web browser, and deploy via Docker or bare-metal.

---

## Prerequisites
- **Node.js 20+** (or Docker)
- **PostgreSQL 14+** (local, Supabase, Neon, RDS, etc.)
- *Optional:* Upstash Redis for distributed rate limiting

---

## Method 1: Web Setup Wizard (Recommended)

The easiest way to get started:

```bash
git clone https://github.com/yourusername/pesto.git
cd pesto
npm install
npm run setup
```

Open **http://localhost:3000/setup** and follow the 4-step wizard:

| Step | What It Does |
|------|-------------|
| 1. Database | Enter your PostgreSQL connection string, test it live |
| 2. Schema | Creates all tables automatically via Drizzle ORM |
| 3. Admin | Set your admin email and password |
| 4. OAuth | Optionally enable GitHub/Google sign-in |

After completing setup, the wizard writes everything to `.env.local` and initializes the database. You'll be redirected to the login page.

---

## Method 2: Manual Configuration

Create `.env.local` at the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pesto"
AUTH_SECRET="run: openssl rand -base64 32"

# Optional: OAuth Providers
AUTH_GITHUB_ID="your_github_client_id"
AUTH_GITHUB_SECRET="your_github_client_secret"
AUTH_GOOGLE_ID="your_google_id"
AUTH_GOOGLE_SECRET="your_google_secret"

# Optional: Rate Limiting
UPSTASH_REDIS_REST_URL="your_redis_url"
UPSTASH_REDIS_REST_TOKEN="your_redis_token"

# Optional: Cron Cleanup
CRON_SECRET="your_secure_secret"
```

Push the schema:
```bash
npx drizzle-kit push
```

Start the server:
```bash
npm run build && npm start
```

Create an admin user via SQL:
```sql
-- First register normally at /login, then promote:
UPDATE "user" SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Docker Deployment

### Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  pesto:
    build: .
    ports:
      - "3000:3000"
    environment:
      - SETUP_MODE=true
    volumes:
      - ./attachments:/app/public/attachments
      - ./.env.local:/app/.env.local
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: pesto
      POSTGRES_PASSWORD: your_secure_password
      POSTGRES_DB: pesto
    volumes:
      - pesto_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  pesto_data:
```

After `docker compose up`, navigate to `http://localhost:3000/setup` to complete configuration. Once configured, you can safely remove `SETUP_MODE=true` to secure the setup route.

---

## Admin Dashboard

Access `/admin` to:
- **Toggle GitHub/Google sign-in** — buttons instantly hide/show on login page
- **Enable/Disable registrations** — prevent new signups
- **Manage users** — promote, ban, or delete
- **Delete pastes globally**

---

## File Attachments

Images uploaded via the paste editor are stored locally at `public/attachments/`. When using Docker, map this to a persistent volume to keep uploads across restarts.

---

## Automated Cleanup

Set up a cron job to clean expired pastes:

```bash
# Set CRON_SECRET in .env.local
0 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/cleanup
```

---

## Linux Compatibility

Pesto uses Node.js `path.join()` and `process.cwd()` throughout — no Windows-specific path separators. Tested on:
- Ubuntu 22.04 / 24.04
- Alpine Linux (Docker)
- Debian 12

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| `ECONNREFUSED` on startup | `DATABASE_URL` not set or DB unreachable. Navigate to `/setup`. |
| OAuth buttons not showing | Enable them in Admin → Settings, ensure env vars are set |
| `drizzle-kit push` fails | Check your `DATABASE_URL` and ensure the DB is running |
| Uploads lost on restart | Mount `public/attachments` as a Docker volume |
