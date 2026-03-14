import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { CreatePasteSchema } from '@/lib/validators'
import { createPaste } from '@/lib/paste'
import { withRateLimit } from '@/lib/ratelimit'
import { detectLanguage } from '@/lib/language'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if banned
    const profile = await db
      .select({ banned: users.banned })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then((res: { banned: boolean | null }[]) => res[0])

    if (profile?.banned) {
      return Response.json({ error: 'Account is banned' }, { status: 403 })
    }

    const body = await req.json()
    const result = CreatePasteSchema.safeParse(body)
    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', fields: result.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    return withRateLimit('pasteCreate', user.id as string, async () => {
      try {
        if (result.data.language === 'auto') {
          result.data.language = detectLanguage(result.data.content)
        }

        const { alias } = await createPaste(user.id as string, result.data)
        return Response.json({ alias, url: `/p/${alias}` }, { status: 201 })
      } catch (err) {
        if (err instanceof Error && err.message === 'ALIAS_TAKEN') {
          return Response.json({ error: 'Alias already taken' }, { status: 409 })
        }
        throw err
      }
    })
  } catch (err) {
    console.error('POST /api/pastes error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

