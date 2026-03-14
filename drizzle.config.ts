/** @type { import("drizzle-kit").Config } */
const config = {
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/pesto',
  },
}

export default config
