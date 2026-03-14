import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function POST(req: Request) {
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
  } catch (error: any) {
    console.error('DB test failed:', error)
    return NextResponse.json({ 
      error: 'Connection failed', 
      details: error.message || 'Could not connect to the database'
    }, { status: 400 })
  }
}
