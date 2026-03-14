import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getPasteByAlias, getPasteVersions, getPasteVersion } from '@/lib/paste'
import { highlight } from '@/lib/highlight'
import { NextRequest } from 'next/server'
import { getAppSettings } from '@/lib/settings'
import { isValidTheme } from '@/lib/themes'

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

export async function GET(req: NextRequest, { params }: RouteParams): Promise<Response> {
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
      const role = await getUserRole(user?.id)
      if (role !== 'admin') {
        return Response.json({ error: 'Not found' }, { status: 404 })
      }
    }

    const url = new URL(req.url)
    const versionParam = url.searchParams.get('version')

    if (versionParam) {
      const versionNum = parseInt(versionParam, 10)
      if (isNaN(versionNum)) {
        return Response.json({ error: 'Invalid version number' }, { status: 400 })
      }

      const version = await getPasteVersion(paste.id, versionNum)
      if (!version) {
        return Response.json({ error: 'Version not found' }, { status: 404 })
      }

      const settings = await getAppSettings()
      const defaultTheme = isValidTheme(settings.defaultTheme)
        ? settings.defaultTheme
        : 'github-dark'
      const html = await highlight(version.content, version.language || 'text', defaultTheme)

      return Response.json({
        version: {
          ...version,
          createdAt: version.createdAt.toISOString(),
        },
        html,
      })
    }

    const versions = await getPasteVersions(paste.id)

    return Response.json({
      versions: versions.map((version) => ({
        id: version.id,
        version: version.version,
        title: version.title,
        language: version.language,
        editorName: version.editorName,
        createdAt: version.createdAt.toISOString(),
      })),
    })
  } catch (err) {
    console.error('GET /api/pastes/[alias]/versions error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
