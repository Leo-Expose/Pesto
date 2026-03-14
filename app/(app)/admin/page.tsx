import React from 'react'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users, pastes as pastesSchema } from '@/lib/db/schema'
import { eq, desc, sql, count, sum } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { AdminDashboard } from './AdminClient'
import { SettingsCard } from './components/settings-card'
import { UsersTable } from './components/users-table'
import { getSettings, getUsers } from './actions'
import type { PasteWithAuthor } from '@/types'

export default async function AdminPage() {
  const session = await auth()
  const user = session?.user
  if (!user || !user.id) notFound()

  const profile = await db.select().from(users).where(eq(users.id, user.id)).limit(1).then((r: { role: string }[]) => r[0])
  if (profile?.role !== 'admin') notFound()

  // Fetch settings and users
  const settings = await getSettings()
  const allUsers = await getUsers()

  // Compute real stats
  const [pasteStats] = await db
    .select({
      totalPastes: count(),
      totalViews: sum(pastesSchema.views),
    })
    .from(pastesSchema)

  const [userStats] = await db
    .select({ totalUsers: count() })
    .from(users)

  // Fetch recent pastes
  const rawPastes = await db
    .select({
      paste: pastesSchema,
      author: users
    })
    .from(pastesSchema)
    .leftJoin(users, eq(pastesSchema.userId, users.id))
    .orderBy(desc(pastesSchema.createdAt))
    .limit(100)

  const pastes = rawPastes.map(({ paste, author }: { paste: any; author: any }) => {
    const { passwordHash, ...rest } = paste
    return {
      ...rest,
      user_id: paste.userId,
      created_at: paste.createdAt?.toISOString() ?? new Date().toISOString(),
      burn_after_reading: paste.burnAfterReading ?? false,
      forked_from: paste.forkedFrom ?? null,
      expires_at: paste.expiresAt?.toISOString() ?? null,
      author: author && author.name ? { username: author.name } : null,
    } as unknown as PasteWithAuthor
  })

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>

      {/* Settings */}
      <SettingsCard initialSettings={{
        allowRegistrations: settings.allowRegistrations,
        enableGithub: settings.enableGithub,
        enableGoogle: settings.enableGoogle,
        instanceName: settings.instanceName ?? 'Pesto',
        defaultTheme: settings.defaultTheme ?? 'github-dark',
        maxPasteSize: settings.maxPasteSize ?? 1048576,
      }} />

      {/* Users Table */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">User Management</h2>
        <UsersTable users={allUsers as any} />
      </div>

      {/* Pastes */}
      <AdminDashboard
        initialPastes={pastes as any}
        stats={{
          totalPastes: pasteStats?.totalPastes ?? 0,
          totalUsers: userStats?.totalUsers ?? 0,
          totalViews: Number(pasteStats?.totalViews ?? 0),
        }}
      />
    </div>
  )
}
