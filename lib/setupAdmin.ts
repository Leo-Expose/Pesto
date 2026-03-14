import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hash } from 'bcrypt-ts'

export async function setupAdmin() {
  try {
    // Check if any admin exists
    const admins = await db.select().from(users).where(eq(users.role, 'admin')).limit(1)

    if (admins.length === 0) {
      console.log('🛡️  No admin user found. Generating initial admin account...')
      
      const crypto = require('crypto')
      const randomPassword = crypto.randomBytes(12).toString('hex') // Strong random password
      const hashedPassword = await hash(randomPassword, 10)

      await db.insert(users).values({
        email: 'admin',
        name: 'Administrator',
        password: hashedPassword,
        role: 'admin',
      })

      console.log('\n=========================================')
      console.log('✅  ADMIN ACCOUNT CREATED')
      console.log('=========================================')
      console.log(`Username: admin`)
      console.log(`Password: ${randomPassword}`)
      console.log('=========================================')
      console.log('⚠️  Please save this password! It will only be shown once.')
      console.log('   You can change it later in the Admin Dashboard.')
      console.log('=========================================\n')
    }
  } catch (error) {
    if ((error as any).code === '42P01') { // PostgreSQL error code for undefined table
        // The table doesn't exist yet, we will quietly skip. User needs to run db set up.
        console.log('ℹ️  Skipping admin generation: Database tables not found. Run `npm run setup` first.')
    } else {
        console.error('❌ Failed to verify/setup admin account:', error)
    }
  }
}
