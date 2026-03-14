import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hash } from 'bcrypt-ts'
import crypto from 'crypto'

export async function setupAdmin() {
  try {
    const admins = await db.select().from(users).where(eq(users.role, 'admin')).limit(1)

    if (admins.length === 0) {
      console.log('No admin user found. Generating initial admin account...')

      const randomPassword = crypto.randomBytes(12).toString('hex')
      const hashedPassword = await hash(randomPassword, 10)

      await db.insert(users).values({
        email: 'admin',
        name: 'Administrator',
        password: hashedPassword,
        role: 'admin',
      })

      console.log('\n=========================================')
      console.log('ADMIN ACCOUNT CREATED')
      console.log('=========================================')
      console.log('Username: admin')
      console.log(`Password: ${randomPassword}`)
      console.log('=========================================')
      console.log('Please save this password. It will only be shown once.')
      console.log('You can change it later in the Admin Dashboard.')
      console.log('=========================================\n')
    }
  } catch (error: unknown) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''

    if (code === '42P01') {
      console.log('Skipping admin generation: Database tables not found. Run `npm run setup` first.')
    } else {
      console.error('Failed to verify/setup admin account:', error)
    }
  }
}
