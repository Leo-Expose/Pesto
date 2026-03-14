'use server'

import { db } from '@/lib/db'
import { appSettings, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { hash } from 'bcrypt-ts'

// --- Settings Actions ---

export async function toggleRegistrations(currentState: boolean) {
  const session = await auth()
  if (session?.user?.role !== 'admin') throw new Error('Unauthorized')

  await db.update(appSettings)
    .set({ allowRegistrations: !currentState })
    .where(eq(appSettings.id, 'global'))

  revalidatePath('/admin')
}

export async function toggleOAuthProvider(provider: 'github' | 'google', currentState: boolean) {
  const session = await auth()
  if (session?.user?.role !== 'admin') throw new Error('Unauthorized')

  const column = provider === 'github' ? 'enableGithub' : 'enableGoogle'

  await db.update(appSettings)
    .set({ [column]: !currentState })
    .where(eq(appSettings.id, 'global'))

  revalidatePath('/admin')
}

export async function getSettings() {
  const session = await auth()
  if (session?.user?.role !== 'admin') throw new Error('Unauthorized')

  let settings = await db.select().from(appSettings).where(eq(appSettings.id, 'global')).limit(1)
  
  if (settings.length === 0) {
    await db.insert(appSettings).values({ id: 'global', allowRegistrations: true, enableGithub: false, enableGoogle: false, setupCompleted: true })
    settings = await db.select().from(appSettings).where(eq(appSettings.id, 'global')).limit(1)
  }

  return settings[0]
}

// --- User Actions ---

export async function getUsers() {
    const session = await auth()
    if (session?.user?.role !== 'admin') throw new Error('Unauthorized')
  
    return await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt
    }).from(users)
}

export async function updateUserRole(userId: string, currentRole: string) {
    const session = await auth()
    if (session?.user?.role !== 'admin') throw new Error('Unauthorized')
    
    if (userId === session.user.id) {
        throw new Error("Cannot change your own role.")
    }

    const newRole = currentRole === 'admin' ? 'user' : 'admin'

    await db.update(users)
      .set({ role: newRole })
      .where(eq(users.id, userId))
  
    revalidatePath('/admin')
}

export async function deleteUser(userId: string) {
    const session = await auth()
    if (session?.user?.role !== 'admin') throw new Error('Unauthorized')

    if (userId === session.user.id) {
        throw new Error("Cannot delete yourself.")
    }

    await db.delete(users).where(eq(users.id, userId))
    revalidatePath('/admin')
}

export async function createUser(formData: FormData) {
    const session = await auth()
    if (session?.user?.role !== 'admin') throw new Error('Unauthorized')

    const email = formData.get('email') as string
    const name = formData.get('name') as string
    const password = formData.get('password') as string
    const role = formData.get('role') as string

    if (!email || !password) throw new Error("Email and password are required")

    const hashedPassword = await hash(password, 10)

    try {
        await db.insert(users).values({
            email,
            name,
            password: hashedPassword,
            role: role || 'user'
        })
    } catch(e) {
        throw new Error("Failed to create user. Email might already be taken.")
    }

    revalidatePath('/admin')
}

export async function toggleBanUser(userId: string, currentlyBanned: boolean) {
  const session = await auth()
  if (session?.user?.role !== 'admin') throw new Error('Unauthorized')
  if (userId === session.user.id) throw new Error("Cannot ban yourself.")

  await db.update(users)
    .set({ banned: !currentlyBanned })
    .where(eq(users.id, userId))

  revalidatePath('/admin')
}

export async function updateInstanceSettings(data: {
  instanceName: string
  defaultTheme: string
  maxPasteSize: number
}) {
  const session = await auth()
  if (session?.user?.role !== 'admin') throw new Error('Unauthorized')

  await db.update(appSettings)
    .set({
      instanceName: data.instanceName,
      defaultTheme: data.defaultTheme,
      maxPasteSize: data.maxPasteSize,
    })
    .where(eq(appSettings.id, 'global'))

  revalidatePath('/admin')
}
