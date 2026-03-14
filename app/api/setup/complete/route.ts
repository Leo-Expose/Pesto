import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { hash } from 'bcrypt-ts'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { adminEmail, adminPassword, adminName, enableGithub, enableGoogle, githubId, githubSecret, googleId, googleSecret } = body

    if (!adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'Admin email and password are required' }, { status: 400 })
    }

    if (adminPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Connect to the database
    let connectionString = process.env.DATABASE_URL
    const envPath = path.join(process.cwd(), '.env.local')
    
    // Fallback to reading from .env.local if not available in process.env
    if (!connectionString && fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8')
      const match = envContent.match(/DATABASE_URL="?([^"\r\n]+)"?/)
      if (match && match[1]) {
        connectionString = match[1].trim()
        process.env.DATABASE_URL = connectionString
      }
    }

    if (!connectionString) {
      return NextResponse.json({ error: 'DATABASE_URL not set. Complete the database step first.' }, { status: 400 })
    }

    const sql = postgres(connectionString)
    const db = drizzle(sql, { schema })

    // Check if setup was already completed
    const existingSettings = await db.select().from(schema.appSettings).where(eq(schema.appSettings.id, 'global')).limit(1)
    if (existingSettings.length > 0 && existingSettings[0].setupCompleted) {
      await sql.end()
      return NextResponse.json({ error: 'Setup has already been completed. Access /admin to manage settings.' }, { status: 403 })
    }

    // Create admin user
    const hashedPassword = await hash(adminPassword, 12)
    
    // Check if user already exists
    const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, adminEmail)).limit(1)
    if (existingUser.length > 0) {
      // Update existing user to admin
      await db.update(schema.users)
        .set({ role: 'admin', password: hashedPassword, name: adminName || 'Administrator' })
        .where(eq(schema.users.email, adminEmail))
    } else {
      await db.insert(schema.users).values({
        email: adminEmail,
        name: adminName || 'Administrator',
        password: hashedPassword,
        role: 'admin',
      })
    }

    // Initialize or update app_settings
    if (existingSettings.length === 0) {
      await db.insert(schema.appSettings).values({
        id: 'global',
        allowRegistrations: true,
        enableGithub: !!enableGithub,
        enableGoogle: !!enableGoogle,
        setupCompleted: true,
      })
    } else {
      await db.update(schema.appSettings)
        .set({
          enableGithub: !!enableGithub,
          enableGoogle: !!enableGoogle,
          setupCompleted: true,
        })
        .where(eq(schema.appSettings.id, 'global'))
    }

    // Write OAuth credentials to .env.local if provided
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''

    const envUpdates: Record<string, string> = {}
    if (enableGithub && githubId && githubSecret) {
      envUpdates['AUTH_GITHUB_ID'] = githubId
      envUpdates['AUTH_GITHUB_SECRET'] = githubSecret
    }
    if (enableGoogle && googleId && googleSecret) {
      envUpdates['AUTH_GOOGLE_ID'] = googleId
      envUpdates['AUTH_GOOGLE_SECRET'] = googleSecret
    }

    for (const [key, value] of Object.entries(envUpdates)) {
      if (envContent.includes(`${key}=`)) {
        envContent = envContent.replace(new RegExp(`${key}=.*`, 'g'), `${key}="${value}"`)
      } else {
        envContent += `\n${key}="${value}"`
      }
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n')

    await sql.end()

    const response = NextResponse.json({ 
      success: true, 
      message: 'Setup complete! You can now log in with your admin credentials.',
      needsRestart: Object.keys(envUpdates).length > 0
    })
    
    // Set a cookie so the edge middleware knows setup is complete without a restart
    response.cookies.set('setup_completed', 'true', { path: '/', maxAge: 60 * 60 * 24 })
    
    return response
  } catch (error: any) {
    console.error('Setup complete failed:', error)
    return NextResponse.json({
      error: 'Setup failed',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}
