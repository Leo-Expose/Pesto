'use server'

import { db } from '@/lib/db'
import { pastes, users } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { compare } from 'bcrypt-ts'
import { cookies } from 'next/headers'
import { highlight } from '@/lib/highlight'
import { auth } from '@/auth'
import type { InferSelectModel } from 'drizzle-orm'

type UserRow = InferSelectModel<typeof users>

export async function verifyPastePassword(alias: string, password: string) {
  const paste = await db
    .select({ passwordHash: pastes.passwordHash })
    .from(pastes)
    .where(eq(pastes.alias, alias.toLowerCase()))
    .limit(1)
    .then((res: Array<{ passwordHash: string | null }>) => res[0])
    
  if (!paste || !paste.passwordHash) {
    return { error: 'Paste not found or not password protected' }
  }
  
  const isValid = await compare(password, paste.passwordHash)
  if (!isValid) {
    return { error: 'Incorrect password' }
  }
  
  const cookieStore = await cookies()
  cookieStore.set(`paste_${alias}_auth`, 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 // 24 hours
  })
  
  return { success: true }
}


export async function rehighlightPaste(alias: string, theme: string) {
  const paste = await db
    .select({ content: pastes.content, language: pastes.language })
    .from(pastes)
    .where(eq(pastes.alias, alias.toLowerCase()))
    .limit(1)
    .then((res: Array<{ content: string; language: string }>) => res[0])
  
  if (!paste) return { error: 'Paste not found' }
  if (paste.language === 'markdown') return { error: 'Cannot re-theme markdown' }
  
  const html = await highlight(paste.content, paste.language, theme)
  return { html }
}


export async function incrementPasteView(alias: string) {
  try {
    await db.update(pastes)
      .set({ views: sql`${pastes.views} + 1` })
      .where(eq(pastes.alias, alias.toLowerCase()))
  } catch {}
}

export async function updateUsername(username: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }
  
  try {
    await db.update(users).set({ name: username }).where(eq(users.id, session.user.id))
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : ''
    const code = typeof e === 'object' && e !== null && 'code' in e ? String(e.code) : ''
    if (message.includes('unique') || code === '23505') return { error: 'Username taken' }
    return { error: 'Failed to save' }
  }
}

export async function getSessionUserProfile() {
  const session = await auth()
  if (!session?.user?.id) return null
  
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)
    .then((r: UserRow[]) => r[0])
  return user
}

export async function rehighlightContent(content: string, language: string, theme?: string) {
  if (!content.trim()) return { html: '' }
  if (language === 'markdown') return { error: 'Use markdown preview instead' }

  const html = await highlight(content, language, theme)
  return { html }
}
