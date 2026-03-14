import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users, pastes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getPasteByAlias, getPasteVersions, getPasteVersion } from '@/lib/paste'
import { highlight } from '@/lib/highlight'
import { NextRequest } from 'next/server'

type RouteParams = { params: Promise<{ alias: string }> }

export async function GET(req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { alias } = await params
    const session = await auth()
    const user = session?.user

    const paste = await getPasteByAlias(alias, user?.id)
    if (!paste) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    // Check access (same logic as paste viewing)
    const pasteUserId = (paste as any).userId || (paste as any).user_id
    if (paste.visibility === 'private' && pasteUserId !== user?.id) {
      let role = 'user'
      if (user?.id) {
        const profile = await db.select({ role: users.role }).from(users).where(eq(users.id, user.id)).limit(1).then((r: { role: string }[]) => r[0])
        if (profile) role = profile.role || 'user'
      }
      if (role !== 'admin') {
        return Response.json({ error: 'Not found' }, { status: 404 })
      }
    }

    // Check if a specific version is requested
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

      // Highlight the version's content
      const html = await highlight(version.content, version.language || 'text')

      return Response.json({
        version: {
          ...version,
          createdAt: version.createdAt.toISOString(),
        },
        html,
      })
    }

    // List all versions
    const versions = await getPasteVersions(paste.id)

    return Response.json({
      versions: versions.map((v) => ({
        id: v.id,
        version: v.version,
        title: v.title,
        language: v.language,
        editorName: v.editorName,
        createdAt: v.createdAt.toISOString(),
      })),
    })
  } catch (err) {
    console.error('GET /api/pastes/[alias]/versions error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
