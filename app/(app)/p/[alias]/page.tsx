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

type Props = { params: Promise<{ alias: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { alias } = await params
    const paste = await getPasteByAlias(alias)
    if (!paste) return { title: 'Not Found — Pesto' }
    return {
      title: `${paste.title} — Pesto`,
      description: `A ${paste.language} paste on Pesto`,
    }
  } catch (error) {
    return { title: 'Error — Pesto' }
  }
}

export default async function PastePage({ params }: Props) {
  try {
    const { alias } = await params
    const session = await auth()
    const user = session?.user

    const paste = await getPasteByAlias(alias, user?.id)
    if (!paste) notFound()

    const pasteUserId = (paste as any).userId || (paste as any).user_id

    // Private paste check
    if (paste.visibility === 'private' && pasteUserId !== user?.id) {
      let role = 'user'
      if (user?.id) {
        const profile = await db.select({ role: users.role }).from(users).where(eq(users.id, user.id)).limit(1).then((r: any[]) => r[0])
        if (profile) role = profile.role || 'user'
      }
      if (role !== 'admin') notFound()
    }

    // Password paste check
    if (paste.visibility === 'password' && pasteUserId !== user?.id) {
      const cookieStore = await cookies()
      const hasAuth = cookieStore.get(`paste_${alias}_auth`)?.value === 'true'
      
      let role = 'user'
      if (user?.id) {
        const profile = await db.select({ role: users.role }).from(users).where(eq(users.id, user.id)).limit(1).then((r: any[]) => r[0])
        if (profile) role = profile.role || 'user'
      }
        
      if (role !== 'admin' && !hasAuth) {
        return <PasswordPrompt alias={alias} />
      }
    }

    const isOwner = user?.id && user.id === pasteUserId

    // Burn after reading logic
    let isBurned = false
    if (paste.burn_after_reading && !isOwner) {
      const headersList = await headers()
      const isPrefetch = 
        headersList.get('next-router-prefetch') === '1' || 
        headersList.get('purpose') === 'prefetch' ||
        headersList.get('x-nextjs-data') === '1'
        
      if (!isPrefetch) {
        // Trigger deletion
        await db.delete(pastes).where(eq(pastes.id, paste.id))
        isBurned = true
      }
    }

    const isMarkdown = paste.language === 'markdown'
    const htmlContent = isMarkdown
      ? renderMarkdown(paste.content)
      : await highlight(paste.content, paste.language)

    return (
      <PasteViewer
        paste={paste}
        highlightedHtml={htmlContent}
        isOwner={!!isOwner}
        isMarkdown={isMarkdown}
        isBurned={isBurned}
      />
    )
  } catch (error: any) {
    return (
      <div className="p-10 text-red-500">
        <h1>500 Internal Server Error</h1>
        <pre>{error.message}</pre>
        <pre>{error.stack}</pre>
      </div>
    )
  }
}
