import { db } from '@/lib/db'
import { pastes, users, pasteVersions } from '@/lib/db/schema'
import { eq, desc, and, sql, type InferSelectModel, max } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { generateAlias } from '@/lib/alias'
import { hash } from 'bcrypt-ts'
import type { Paste, PasteWithAuthor } from '@/types'
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
  } catch (error: any) {
    const dbError = error.cause || error
    if (dbError.code === '23505') throw new Error('ALIAS_TAKEN')
    throw new Error(`Database error: ${dbError.message || error.message}`)
  }

  return { alias: pasteAlias }
}

export async function getPasteByAlias(
  pasteAlias: string,
  userId?: string | null
): Promise<PasteWithAuthor | null> {
  const parentPastes = alias(pastes, 'parentPastes')

  const result = await db
    .select({
      paste: pastes,
      author: users,
      parent: { alias: parentPastes.alias, title: parentPastes.title }
    })
    .from(pastes)
    .leftJoin(users, eq(pastes.userId, users.id))
    .leftJoin(parentPastes, eq(pastes.forkedFrom, parentPastes.id))
    .where(eq(pastes.alias, pasteAlias.toLowerCase()))
    .limit(1)
    .then((res: { paste: PasteRow; author: UserRow | null; parent: { alias: string | null; title: string | null } }[]) => res[0])

  if (!result || !result.paste) return null

  const data = result.paste

  // Check if expired
  if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
    return null
  }

  const { passwordHash: _, ...rest } = data

  const paste: PasteWithAuthor = {
    ...rest,
    author: result.author && result.author.name ? { username: result.author.name } : null,
    parent: result.parent?.alias ? { alias: result.parent.alias, title: result.parent.title } : null,
  } as unknown as PasteWithAuthor

  return paste
}

export async function updatePaste(
  pasteAlias: string,
  userId: string,
  data: UpdatePasteInput
): Promise<Paste | null> {
  // 1. Fetch current paste before updating (for version snapshot)
  const current = await db
    .select()
    .from(pastes)
    .where(and(eq(pastes.alias, pasteAlias.toLowerCase()), eq(pastes.userId, userId)))
    .limit(1)
    .then((res: PasteRow[]) => res[0])

  if (!current) return null

  // 2. Determine next version number
  const [maxVersionRow] = await db
    .select({ maxVersion: max(pasteVersions.version) })
    .from(pasteVersions)
    .where(eq(pasteVersions.pasteId, current.id))

  const nextVersion = (maxVersionRow?.maxVersion ?? 0) + 1

  // 3. Snapshot current state into paste_versions
  await db.insert(pasteVersions).values({
    pasteId: current.id,
    title: current.title,
    content: current.content,
    language: current.language,
    version: nextVersion,
    editedBy: userId,
  })

  // 4. Apply the update
  let passwordHash: string | undefined = undefined
  if (data.password) {
    passwordHash = await hash(data.password, 10)
  }

  const { password, ...updateData } = data

  const updated = await db
    .update(pastes)
    .set({
      ...updateData,
      ...(passwordHash ? { passwordHash } : {})
    })
    .where(and(eq(pastes.alias, pasteAlias.toLowerCase()), eq(pastes.userId, userId)))
    .returning()
    .then((res: PasteRow[]) => res[0])

  if (!updated) return null

  const { passwordHash: _, ...rest } = updated
  return rest as unknown as Paste
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
    .then((res: { version: VersionRow; editor: { name: string | null } | null }[]) => res[0])

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

  return data.map((item: PasteRow) => {
    const { passwordHash: _, ...rest } = item
    return rest as unknown as Paste
  })
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

  return data.map(({ paste, author }: { paste: PasteRow; author: UserRow | null }) => {
    const { passwordHash: _, ...rest } = paste
    return {
      ...rest,
      author: author && author.name ? { username: author.name } : null,
    } as unknown as PasteWithAuthor
  })
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
