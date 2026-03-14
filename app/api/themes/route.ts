import { listThemes } from '@/lib/themes'
import { NextResponse } from 'next/server'

export async function GET() {
  const themes = listThemes()
  return NextResponse.json({ themes })
}
