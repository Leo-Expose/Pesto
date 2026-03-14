import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getPasteByAlias, updatePaste, deletePaste } from '@/lib/paste'
import { UpdatePasteSchema } from '@/lib/validators'
import { detectLanguage } from '@/lib/language'
import { NextRequest } from 'next/server'

type RouteParams = { params: Promise<{ alias: string }> }
type RoleRow = { role: string | null }

async function getUserRole(userId: string): Promise<string> {
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
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const pasteUserId = paste.userId ?? paste.user_id

    if (paste.visibility === 'private' && pasteUserId !== user?.id) {
      const role = user?.id ? await getUserRole(user.id) : 'user'
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

    const existing = await getPasteByAlias(alias, user.id)
    if (!existing) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const pasteUserId = existing.userId ?? existing.user_id
    let effectiveUserId = user.id

    if (pasteUserId !== user.id) {
      const role = await getUserRole(user.id)
      if (role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
      effectiveUserId = pasteUserId ?? user.id
    }

    if (result.data.language === 'auto') {
      const detectTarget = result.data.content || existing.content
      result.data.language = detectLanguage(detectTarget)
    }

    const updated = await updatePaste(alias, effectiveUserId, result.data)
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

    const pasteUserId = existing.userId ?? existing.user_id

    if (pasteUserId !== user.id) {
      const role = await getUserRole(user.id)
      if (role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    await deletePaste(alias, pasteUserId ?? user.id)
    return new Response(null, { status: 204 })
  } catch (err) {
    console.error('DELETE /api/pastes/[alias] error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
