import { NextResponse } from 'next/server'
import { getAppSettings } from '@/lib/settings'

export async function GET() {
  return NextResponse.json(await getAppSettings())
}
