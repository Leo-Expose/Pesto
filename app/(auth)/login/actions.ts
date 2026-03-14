'use server'

import { db } from '@/lib/db'
import { users, appSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hash } from 'bcrypt-ts'

export async function registerLocalAccount(formData: FormData) {
  const email = formData.get('email') as string
  const name = formData.get('name') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // Check if registrations are allowed
  const settings = await db.select().from(appSettings).where(eq(appSettings.id, 'global')).limit(1)
  if (settings.length > 0 && !settings[0].allowRegistrations) {
    return { error: 'New user registrations are currently disabled by the administrator.' }
  }

  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existingUser.length > 0) {
    return { error: 'An account with this email already exists.' }
  }

  // Create user
  try {
    const hashedPassword = await hash(password, 10)
    await db.insert(users).values({
      email,
      name,
      password: hashedPassword,
      role: 'user',
    })
    
    return { success: true }
  } catch (error) {
    console.error('Registration failed:', error)
    return { error: 'Failed to create account. Please try again.' }
  }
}
