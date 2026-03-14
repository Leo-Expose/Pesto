import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getPasteByAlias, updatePaste, deletePaste } from '@/lib/paste'
import { UpdatePasteSchema } from '@/lib/validators'
import { detectLanguage } from '@/lib/language'
import { NextRequest } from 'next/server'

type RouteParams = { params: Promise<{ alias: string }> }

export async function GET(_req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { alias } = await params
    const session = await auth()
    const user = session?.user

    const paste = await getPasteByAlias(alias, user?.id)
    if (!paste) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const userId = (paste as any).userId || (paste as any).user_id

    if (paste.visibility === 'private' && userId !== user?.id) {
      let role = 'user'
      if (user?.id) {
        const profile = await db.select({ role: users.role }).from(users).where(eq(users.id, user.id)).limit(1).then((r: { role: string }[]) => r[0])
        if (profile) role = profile.role || 'user'
      }
      
      if (role !== 'admin') {
        return Response.json({ error: 'Not found' }, { status: 404 })
      }
    }

    return Response.json({ data: paste })
  } catch (err) {
    console.error('GET /api/pastes/[alias] error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { alias } = await params
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = UpdatePasteSchema.safeParse(body)
    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', fields: result.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    // Check ownership or admin
    const existing = await getPasteByAlias(alias, user.id)
    if (!existing) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const pasteUserId = (existing as any).userId || (existing as any).user_id
    let effUserId = user.id

    if (pasteUserId !== user.id) {
      const profile = await db.select({ role: users.role }).from(users).where(eq(users.id, user.id)).limit(1).then((r: { role: string }[]) => r[0])
      if (profile?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
      effUserId = pasteUserId
    }

    if (result.data.language === 'auto') {
      const detectTarget = result.data.content || existing.content
      result.data.language = detectLanguage(detectTarget)
    }

    const updated = await updatePaste(alias, effUserId, result.data)
    if (!updated) {
      return Response.json({ error: 'Update failed' }, { status: 500 })
    }

    return Response.json({ data: updated })
  } catch (err) {
    console.error('PATCH /api/pastes/[alias] error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { alias } = await params
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await getPasteByAlias(alias, user.id)
    if (!existing) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const pasteUserId = (existing as any).userId || (existing as any).user_id

    if (pasteUserId !== user.id) {
      const profile = await db.select({ role: users.role }).from(users).where(eq(users.id, user.id)).limit(1).then((r: { role: string }[]) => r[0])
      if (profile?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    await deletePaste(alias, pasteUserId)
    return new Response(null, { status: 204 })
  } catch (err) {
    console.error('DELETE /api/pastes/[alias] error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
