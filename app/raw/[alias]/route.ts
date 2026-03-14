import { auth } from '@/auth'
import { getPasteByAlias } from '@/lib/paste'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest } from 'next/server'

type RouteParams = { params: Promise<{ alias: string }> }

export async function GET(_req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { alias } = await params
    const session = await auth()
    const user = session?.user

    const paste = await getPasteByAlias(alias, user?.id)
    if (!paste) {
      return new Response('Not found', { status: 404 })
    }

    const pasteUserId = (paste as any).userId || (paste as any).user_id

    if (paste.visibility === 'private' && pasteUserId !== user?.id) {
      let role = 'user'
      if (user?.id) {
        const profile = await db.select({ role: users.role }).from(users).where(eq(users.id, user.id)).limit(1).then((r: any[]) => r[0])
        if (profile) role = profile.role || 'user'
      }

      if (role !== 'admin') {
        return new Response('Not found', { status: 404 })
      }
    }

    return new Response(paste.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${alias}.txt"`,
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('Raw endpoint error:', err)
    return new Response('Internal server error', { status: 500 })
  }
}
