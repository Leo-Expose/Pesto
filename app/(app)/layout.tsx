import React from 'react'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Navbar } from '@/components/layout/Navbar'
import type { Profile } from '@/types'
import type { InferSelectModel } from 'drizzle-orm'

type UserRow = InferSelectModel<typeof users>

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user

  let profile: Profile | null = null
  if (user && user.id) {
    const data = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then((res: UserRow[]) => res[0])

    if (data) {
      profile = {
        id: data.id,
        username: data.name || '',
        role: data.role as 'admin' | 'user',
        banned: data.banned || false,
        created_at: data.createdAt?.toISOString() || new Date().toISOString()
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        user={user && user.id ? { id: user.id, email: user.email || '' } : null}
        profile={profile}
      />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
