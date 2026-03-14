import fs from 'fs'
import path from 'path'
import postgres from 'postgres'

function readEnvFileValue(key: string): string | null {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    return null
  }

  const envContent = fs.readFileSync(envPath, 'utf8')
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = envContent.match(new RegExp(`^${escapedKey}="?([^"\\r\\n]+)"?$`, 'm'))
  return match?.[1]?.trim() || null
}

export function getConfiguredDatabaseUrl(): string | null {
  return process.env.DATABASE_URL || readEnvFileValue('DATABASE_URL')
}

export function isSetupReopenEnabled(): boolean {
  return process.env.SETUP_REOPEN === 'true'
}

export async function isSetupCompleted(): Promise<boolean> {
  const connectionString = getConfiguredDatabaseUrl()
  if (!connectionString) {
    return false
  }

  const sql = postgres(connectionString, { connect_timeout: 5 })

  try {
    const rows = await sql<{ setup_completed: boolean }[]>`
      select setup_completed
      from app_settings
      where id = 'global'
      limit 1
    `

    return rows[0]?.setup_completed === true
  } catch {
    return false
  } finally {
    await sql.end({ timeout: 5 })
  }
}

export async function isSetupLocked(): Promise<boolean> {
  if (isSetupReopenEnabled()) {
    return false
  }

  return isSetupCompleted()
}
