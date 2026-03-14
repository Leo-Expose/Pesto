import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { isSetupRequestAllowed } from '@/lib/setupAccess'
import { isSetupLocked } from '@/lib/setupState'

export async function POST(req: NextRequest) {
  if (!isSetupRequestAllowed(req)) {
    return NextResponse.json({ error: 'Setup is not accessible from this network location.' }, { status: 403 })
  }

  if (await isSetupLocked()) {
    return NextResponse.json({ error: 'Setup has already been completed. Set SETUP_REOPEN=true to reopen it intentionally.' }, { status: 403 })
  }

  try {
    const { connectionString } = await req.json()
    if (!connectionString) {
      return NextResponse.json({ error: 'Connection string is required' }, { status: 400 })
    }

    const envPath = path.join(process.cwd(), '.env.local')
    
    // Read existing .env.local or start fresh
    let envContent = ''
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8')
    }

    // Update or add DATABASE_URL (handling potential # comments)
    if (envContent.includes('DATABASE_URL=')) {
      envContent = envContent.replace(/^.*DATABASE_URL=.*/gm, `DATABASE_URL="${connectionString}"`)
    } else {
      envContent += `\nDATABASE_URL="${connectionString}"`
    }

    // Generate AUTH_SECRET if it doesn't exist
    if (!envContent.includes('AUTH_SECRET=')) {
      const crypto = await import('crypto')
      const secret = crypto.randomBytes(32).toString('hex')
      envContent += `\nAUTH_SECRET="${secret}"`
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n')

    // Set env var for current process so drizzle-kit can use it
    process.env.DATABASE_URL = connectionString

    // Run drizzle-kit push to initialize the schema
    execSync('npx drizzle-kit push --force', {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: connectionString },
      timeout: 30000,
    })

    return NextResponse.json({ success: true, message: 'Schema pushed successfully!' })
  } catch (error: unknown) {
    const details =
      typeof error === 'object' &&
      error !== null &&
      'stderr' in error &&
      typeof (error as { stderr?: { toString(): string } }).stderr?.toString === 'function'
        ? (error as { stderr?: { toString(): string } }).stderr?.toString()
        : error instanceof Error
          ? error.message
          : 'Unknown error'
    console.error('Schema push failed:', error)
    return NextResponse.json({
      error: 'Schema push failed',
      details
    }, { status: 500 })
  }
}
