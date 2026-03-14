import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

// Allow app to boot without a DATABASE_URL (for /setup wizard)
const sql = connectionString
  ? postgres(connectionString)
  : (null as any)

export const db = sql ? drizzle(sql, { schema }) : (null as any)

/** Returns true if a database connection is configured */
export function isDbConfigured(): boolean {
  return !!connectionString
}
