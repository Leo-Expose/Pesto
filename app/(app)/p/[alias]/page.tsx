import React from 'react'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users, pastes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getPasteByAlias } from '@/lib/paste'
import { highlight } from '@/lib/highlight'
import { renderMarkdown } from '@/lib/markdown'
import { PasteViewer } from '@/components/paste/PasteViewer'
import { PasswordPrompt } from '@/components/paste/PasswordPrompt'
import { cookies, headers } from 'next/headers'
import type { Metadata } from 'next'
import { getAppSettings } from '@/lib/settings'
import { isValidTheme } from '@/lib/themes'

type Props = { params: Promise<{ alias: string }> }
type RoleRow = { role: string | null }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { alias } = await params
    const paste = await getPasteByAlias(alias)
    if (!paste) return { title: 'Not Found - Pesto' }

    return {
      title: `${paste.title} - Pesto`,
      description: `A ${paste.language} paste on Pesto`,
    }
  } catch {
    return { title: 'Error - Pesto' }
  }
}

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

export default async function PastePage({ params }: Props) {
  try {
    const { alias } = await params
    const session = await auth()
    const user = session?.user

    const paste = await getPasteByAlias(alias, user?.id)
    if (!paste) notFound()

    const pasteUserId = paste.userId ?? paste.user_id

    if (paste.visibility === 'private' && pasteUserId !== user?.id) {
      const role = await getUserRole(user?.id)
      if (role !== 'admin') notFound()
    }

    if (paste.visibility === 'password' && pasteUserId !== user?.id) {
      const cookieStore = await cookies()
      const hasAuth = cookieStore.get(`paste_${alias}_auth`)?.value === 'true'
      const role = await getUserRole(user?.id)

      if (role !== 'admin' && !hasAuth) {
        return <PasswordPrompt alias={alias} />
      }
    }

    const isOwner = user?.id === pasteUserId

    let isBurned = false
    if (paste.burn_after_reading && !isOwner) {
      const headersList = await headers()
      const isPrefetch =
        headersList.get('next-router-prefetch') === '1' ||
        headersList.get('purpose') === 'prefetch' ||
        headersList.get('x-nextjs-data') === '1'

      if (!isPrefetch) {
        await db.delete(pastes).where(eq(pastes.id, paste.id))
        isBurned = true
      }
    }

    const isMarkdown = paste.language === 'markdown'
    const settings = await getAppSettings()
    const defaultTheme = isValidTheme(settings.defaultTheme)
      ? settings.defaultTheme
      : 'github-dark'
    const htmlContent = isMarkdown
      ? renderMarkdown(paste.content)
      : await highlight(paste.content, paste.language, defaultTheme)

    return (
      <PasteViewer
        paste={paste}
        highlightedHtml={htmlContent}
        initialTheme={isMarkdown ? 'system' : defaultTheme}
        isOwner={isOwner}
        isMarkdown={isMarkdown}
        isBurned={isBurned}
      />
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const stack = error instanceof Error ? error.stack : ''

    return (
      <div className="p-10 text-red-500">
        <h1>500 Internal Server Error</h1>
        <pre>{message}</pre>
        {stack ? <pre>{stack}</pre> : null}
      </div>
    )
  }
}
