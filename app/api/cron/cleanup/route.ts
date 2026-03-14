import { db } from '@/lib/db'
import { pastes } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

export async function GET(req: Request): Promise<Response> {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Delete expired pastes
    const deletedResult = await db
      .delete(pastes)
      .where(
        sql`${pastes.expiresAt} < CURRENT_TIMESTAMP AND ${pastes.expiresAt} IS NOT NULL`
      )
      .returning({ id: pastes.id })

    const count = deletedResult.length

    return Response.json({ deleted: count ?? 0 })
  } catch (err) {
    console.error('Cron cleanup error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
