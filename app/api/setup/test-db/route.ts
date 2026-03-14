import { NextRequest, NextResponse } from 'next/server'
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

    // Test the connection by attempting to connect with postgres.js
    const postgres = (await import('postgres')).default
    const sql = postgres(connectionString, { connect_timeout: 10 })
    
    // Run a simple query to verify
    await sql`SELECT 1 as ok`
    await sql.end()

    return NextResponse.json({ success: true, message: 'Connection successful!' })
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : 'Could not connect to the database'
    console.error('DB test failed:', error)
    return NextResponse.json({ 
      error: 'Connection failed', 
      details
    }, { status: 400 })
  }
}
