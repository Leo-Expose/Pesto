import { auth } from '@/auth'
import { getPasteByAlias } from '@/lib/paste'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest } from 'next/server'

type RouteParams = { params: Promise<{ alias: string }> }
type RoleRow = { role: string | null }

async function getUserRole(userId: string | undefined): Promise<string> {
  if (!userId) return 'user'

  const profile = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows: RoleRow[]) => rows[0])

  return profile?.role || 'user'
}

export async function GET(_req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { alias } = await params
    const session = await auth()
    const user = session?.user

    const paste = await getPasteByAlias(alias, user?.id)
    if (!paste) {
      return new Response('Not found', { status: 404 })
    }

    const pasteUserId = paste.userId ?? paste.user_id

    if (paste.visibility === 'private' && pasteUserId !== user?.id) {
      const role = await getUserRole(user?.id)
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
