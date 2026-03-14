import React from 'react'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users, pastes as pastesSchema } from '@/lib/db/schema'
import { eq, desc, count, sum, type InferSelectModel } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { AdminDashboard } from './AdminClient'
import { SettingsCard } from './components/settings-card'
import { UsersTable } from './components/users-table'
import { getSettings, getUsers } from './actions'
import type { PasteWithAuthor, PasteVisibility } from '@/types'

type UserRow = InferSelectModel<typeof users>
type PasteRow = InferSelectModel<typeof pastesSchema>
type AdminUser = Awaited<ReturnType<typeof getUsers>>[number]

function toPasteWithAuthor(paste: PasteRow, author: UserRow | null): PasteWithAuthor {
  const { passwordHash: omittedPasswordHash } = paste
  void omittedPasswordHash

  return {
    id: paste.id,
    user_id: paste.userId,
    userId: paste.userId,
    title: paste.title,
    content: paste.content,
    language: paste.language,
    alias: paste.alias,
    visibility: paste.visibility as PasteVisibility,
    burn_after_reading: paste.burnAfterReading ?? false,
    burnAfterReading: paste.burnAfterReading ?? false,
    forked_from: paste.forkedFrom ?? null,
    forkedFrom: paste.forkedFrom ?? null,
    expires_at: paste.expiresAt?.toISOString() ?? null,
    expiresAt: paste.expiresAt?.toISOString() ?? null,
    created_at: paste.createdAt?.toISOString() ?? new Date().toISOString(),
    createdAt: paste.createdAt?.toISOString() ?? new Date().toISOString(),
    views: paste.views ?? 0,
    author: author?.name ? { username: author.name } : null,
  }
}

export default async function AdminPage() {
  const session = await auth()
  const user = session?.user
  if (!user || !user.id) notFound()

  const profile = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)
    .then((rows: UserRow[]) => rows[0])

  if (profile?.role !== 'admin') notFound()

  const settings = await getSettings()
  const allUsers = await getUsers()

  const [pasteStats] = await db
    .select({
      totalPastes: count(),
      totalViews: sum(pastesSchema.views),
    })
    .from(pastesSchema)

  const [userStats] = await db
    .select({ totalUsers: count() })
    .from(users)

  const rawPastes = await db
    .select({
      paste: pastesSchema,
      author: users,
    })
    .from(pastesSchema)
    .leftJoin(users, eq(pastesSchema.userId, users.id))
    .orderBy(desc(pastesSchema.createdAt))
    .limit(100)

  const pastes = rawPastes.map(({ paste, author }) => toPasteWithAuthor(paste, author))

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>

      <SettingsCard initialSettings={{
        allowRegistrations: settings.allowRegistrations,
        enableGithub: settings.enableGithub,
        enableGoogle: settings.enableGoogle,
        instanceName: settings.instanceName ?? 'Pesto',
        defaultTheme: settings.defaultTheme ?? 'github-dark',
        maxPasteSize: settings.maxPasteSize ?? 1048576,
      }} />

      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">User Management</h2>
        <UsersTable users={allUsers as AdminUser[]} />
      </div>

      <AdminDashboard
        initialPastes={pastes}
        stats={{
          totalPastes: pasteStats?.totalPastes ?? 0,
          totalUsers: userStats?.totalUsers ?? 0,
          totalViews: Number(pasteStats?.totalViews ?? 0),
        }}
      />
    </div>
  )
}
