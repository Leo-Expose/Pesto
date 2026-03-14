import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

export async function POST(req: Request) {
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
  } catch (error: any) {
    console.error('Schema push failed:', error)
    return NextResponse.json({
      error: 'Schema push failed',
      details: error.stderr?.toString() || error.message || 'Unknown error'
    }, { status: 500 })
  }
}
