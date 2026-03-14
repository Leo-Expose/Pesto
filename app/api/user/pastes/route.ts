import { auth } from '@/auth'
import { db } from '@/lib/db'
import { pastes } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
export async function GET(): Promise<Response> {
  try {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await db
      .select({
        id: pastes.id,
        user_id: pastes.userId,
        title: pastes.title,
        content: pastes.content,
        language: pastes.language,
        alias: pastes.alias,
        visibility: pastes.visibility,
        burn_after_reading: pastes.burnAfterReading,
        forked_from: pastes.forkedFrom,
        views: pastes.views,
        expires_at: pastes.expiresAt,
        created_at: pastes.createdAt
      })
      .from(pastes)
      .where(eq(pastes.userId, user.id))
      .orderBy(desc(pastes.createdAt))

    return Response.json({ data: data ?? [] })
  } catch (err) {
    console.error('GET /api/user/pastes error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
