import { NextResponse } from 'next/server'
import { isDbConfigured } from '@/lib/db'

export async function GET() {
  // If DB is not configured, return defaults
  if (!isDbConfigured()) {
    return NextResponse.json({
      allowRegistrations: true,
      enableGithub: false,
      enableGoogle: false,
      setupCompleted: false,
    })
  }

  try {
    // Dynamic import to avoid crash when db is null
    const { db } = await import('@/lib/db')
    const { appSettings } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')

    const settings = await db.select().from(appSettings).where(eq(appSettings.id, 'global')).limit(1)

    if (settings.length === 0) {
      return NextResponse.json({
        allowRegistrations: true,
        enableGithub: false,
        enableGoogle: false,
        setupCompleted: false,
      })
    }

    return NextResponse.json({
      allowRegistrations: settings[0].allowRegistrations,
      enableGithub: settings[0].enableGithub,
      enableGoogle: settings[0].enableGoogle,
      setupCompleted: settings[0].setupCompleted,
    })
  } catch (error) {
    // DB not ready
    return NextResponse.json({
      allowRegistrations: true,
      enableGithub: false,
      enableGoogle: false,
      setupCompleted: false,
    })
  }
}
