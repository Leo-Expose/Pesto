import { db } from '@/lib/db'
import { pastes, users, pasteVersions } from '@/lib/db/schema'
import { eq, desc, and, sql, type InferSelectModel, max } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { generateAlias } from '@/lib/alias'
import { hash } from 'bcrypt-ts'
import type { Paste, PasteWithAuthor, PasteVisibility } from '@/types'
import type { CreatePasteInput, UpdatePasteInput } from '@/lib/validators'

type PasteRow = InferSelectModel<typeof pastes>
type UserRow = InferSelectModel<typeof users>
type VersionRow = InferSelectModel<typeof pasteVersions>

const EXPIRY_MAP: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
}

function toPaste(row: PasteRow): Paste {
  const { passwordHash: omittedPasswordHash } = row
  void omittedPasswordHash

  return {
    id: row.id,
    user_id: row.userId,
    userId: row.userId,
    title: row.title,
    content: row.content,
    language: row.language,
    alias: row.alias,
    visibility: row.visibility as PasteVisibility,
    burn_after_reading: row.burnAfterReading ?? false,
    burnAfterReading: row.burnAfterReading ?? false,
    forked_from: row.forkedFrom ?? null,
    forkedFrom: row.forkedFrom ?? null,
    expires_at: row.expiresAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    created_at: row.createdAt?.toISOString() ?? new Date().toISOString(),
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    views: row.views ?? 0,
  }
}

function toPasteWithAuthor(
  row: PasteRow,
  author: UserRow | null,
  parent?: { alias: string | null; title: string | null } | null
): PasteWithAuthor {
  return {
    ...toPaste(row),
    author: author?.name ? { username: author.name } : null,
    parent: parent?.alias ? { alias: parent.alias, title: parent.title ?? 'Untitled' } : null,
  }
}

export async function createPaste(
  userId: string,
  data: CreatePasteInput
): Promise<{ alias: string }> {
  const pasteAlias = data.alias || generateAlias()
  const expiresAt = data.expiry !== 'never' && EXPIRY_MAP[data.expiry]
    ? new Date(Date.now() + EXPIRY_MAP[data.expiry])
    : null

  let passwordHash: string | null = null
  if (data.visibility === 'password' && data.password) {
    passwordHash = await hash(data.password, 10)
  }

  try {
    await db.insert(pastes).values({
      userId,
      title: data.title || 'Untitled',
      content: data.content,
      language: data.language || 'text',
      alias: pasteAlias,
      visibility: data.visibility,
      passwordHash,
      burnAfterReading: data.burn_after_reading || false,
      forkedFrom: data.forked_from || null,
      expiresAt,
    })
  } catch (error: unknown) {
    const dbError = typeof error === 'object' && error !== null && 'cause' in error
      ? error.cause
      : error
    const code = typeof dbError === 'object' && dbError !== null && 'code' in dbError ? String(dbError.code) : ''
    const message = dbError instanceof Error ? dbError.message : error instanceof Error ? error.message : 'Unknown error'

    if (code === '23505') throw new Error('ALIAS_TAKEN')
    throw new Error(`Database error: ${message}`)
  }

  return { alias: pasteAlias }
}

export async function getPasteByAlias(
  pasteAlias: string,
  userId?: string | null
): Promise<PasteWithAuthor | null> {
  void userId
  const parentPastes = alias(pastes, 'parentPastes')

  const result = await db
    .select({
      paste: pastes,
      author: users,
      parent: { alias: parentPastes.alias, title: parentPastes.title },
    })
    .from(pastes)
    .leftJoin(users, eq(pastes.userId, users.id))
    .leftJoin(parentPastes, eq(pastes.forkedFrom, parentPastes.id))
    .where(eq(pastes.alias, pasteAlias.toLowerCase()))
    .limit(1)
    .then((rows: Array<{
      paste: PasteRow
      author: UserRow | null
      parent: { alias: string | null; title: string | null } | null
    }>) => rows[0])

  if (!result?.paste) return null

  if (result.paste.expiresAt && new Date(result.paste.expiresAt) < new Date()) {
    return null
  }

  return toPasteWithAuthor(result.paste, result.author, result.parent)
}

export async function updatePaste(
  pasteAlias: string,
  userId: string,
  data: UpdatePasteInput
): Promise<Paste | null> {
  const current = await db
    .select()
    .from(pastes)
    .where(and(eq(pastes.alias, pasteAlias.toLowerCase()), eq(pastes.userId, userId)))
    .limit(1)
    .then((rows: PasteRow[]) => rows[0])

  if (!current) return null

  const [maxVersionRow] = await db
    .select({ maxVersion: max(pasteVersions.version) })
    .from(pasteVersions)
    .where(eq(pasteVersions.pasteId, current.id))

  const nextVersion = (maxVersionRow?.maxVersion ?? 0) + 1

  await db.insert(pasteVersions).values({
    pasteId: current.id,
    title: current.title,
    content: current.content,
    language: current.language,
    version: nextVersion,
    editedBy: userId,
  })

  let passwordHash: string | undefined
  if (data.password) {
    passwordHash = await hash(data.password, 10)
  }

  const { password: omittedPassword, ...updateData } = data
  void omittedPassword

  const updated = await db
    .update(pastes)
    .set({
      ...updateData,
      ...(passwordHash ? { passwordHash } : {}),
    })
    .where(and(eq(pastes.alias, pasteAlias.toLowerCase()), eq(pastes.userId, userId)))
    .returning()
    .then((rows: PasteRow[]) => rows[0])

  return updated ? toPaste(updated) : null
}

export interface PasteVersion {
  id: string
  version: number
  title: string | null
  content: string
  language: string | null
  editedBy: string | null
  editorName?: string | null
  createdAt: Date
}

export async function getPasteVersions(pasteId: string): Promise<PasteVersion[]> {
  const data = await db
    .select({
      version: pasteVersions,
      editor: { name: users.name },
    })
    .from(pasteVersions)
    .leftJoin(users, eq(pasteVersions.editedBy, users.id))
    .where(eq(pasteVersions.pasteId, pasteId))
    .orderBy(desc(pasteVersions.version))

  return data.map(({ version, editor }: { version: VersionRow; editor: { name: string | null } | null }) => ({
    id: version.id,
    version: version.version,
    title: version.title,
    content: version.content,
    language: version.language,
    editedBy: version.editedBy,
    editorName: editor?.name ?? null,
    createdAt: version.createdAt,
  }))
}

export async function getPasteVersion(pasteId: string, versionNumber: number): Promise<PasteVersion | null> {
  const result = await db
    .select({
      version: pasteVersions,
      editor: { name: users.name },
    })
    .from(pasteVersions)
    .leftJoin(users, eq(pasteVersions.editedBy, users.id))
    .where(and(
      eq(pasteVersions.pasteId, pasteId),
      eq(pasteVersions.version, versionNumber)
    ))
    .limit(1)
    .then((rows: Array<{ version: VersionRow; editor: { name: string | null } | null }>) => rows[0])

  if (!result) return null

  return {
    id: result.version.id,
    version: result.version.version,
    title: result.version.title,
    content: result.version.content,
    language: result.version.language,
    editedBy: result.version.editedBy,
    editorName: result.editor?.name ?? null,
    createdAt: result.version.createdAt,
  }
}

export async function deletePaste(pasteAlias: string, userId: string): Promise<boolean> {
  await db
    .delete(pastes)
    .where(and(eq(pastes.alias, pasteAlias.toLowerCase()), eq(pastes.userId, userId)))

  return true
}

export async function listUserPastes(userId: string): Promise<Paste[]> {
  const data = await db
    .select()
    .from(pastes)
    .where(eq(pastes.userId, userId))
    .orderBy(desc(pastes.createdAt))

  return data.map((item: PasteRow) => toPaste(item))
}

export async function listPublicPastes(limitCount = 20): Promise<PasteWithAuthor[]> {
  const data = await db
    .select({
      paste: pastes,
      author: users,
    })
    .from(pastes)
    .leftJoin(users, eq(pastes.userId, users.id))
    .where(eq(pastes.visibility, 'public'))
    .orderBy(desc(pastes.createdAt))
    .limit(limitCount)

  return data.map(({ paste, author }: { paste: PasteRow; author: UserRow | null }) =>
    toPasteWithAuthor(paste, author)
  )
}

export async function incrementViews(pasteAlias: string): Promise<void> {
  try {
    await db.update(pastes)
      .set({ views: sql`${pastes.views} + 1` })
      .where(eq(pastes.alias, pasteAlias.toLowerCase()))
  } catch {
    // fire-and-forget: view increment is non-critical
  }
}
