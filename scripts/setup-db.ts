import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { execSync } from 'child_process'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const envPath = path.join(process.cwd(), '.env.local')

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve))
}

async function setupDatabase() {
  console.log('🌱 Welcome to the Pesto Setup Script!\n')

  let dbType = await askQuestion('Are you using Local Postgres or Supabase? (postgres/supabase) [postgres]: ')
  dbType = dbType.trim().toLowerCase() || 'postgres'

  console.log('\nPlease enter your database connection string.')
  console.log('For Local Postgres, it usually looks like: postgresql://user:password@localhost:5432/pesto')
  console.log('For Supabase, you can find the Transaction connection string in Database Settings -> Connection String.\n')

  const dbUrl = await askQuestion('DATABASE_URL: ')

  if (!dbUrl.trim()) {
    console.error('❌ Connection string cannot be empty.')
    process.exit(1)
  }

  // Read existing .env.local or create new one
  let envContent = ''
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
  }

  // Update or append DATABASE_URL
  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${dbUrl.trim()}"`)
  } else {
    envContent += `\nDATABASE_URL="${dbUrl.trim()}"`
  }

  // Generate an AUTH_SECRET if it doesn't exist
  if (!envContent.includes('AUTH_SECRET=')) {
    const crypto = require('crypto')
    const secret = crypto.randomBytes(32).toString('hex')
    envContent += `\nAUTH_SECRET="${secret}"`
  }

  fs.writeFileSync(envPath, envContent)
  console.log('\n✅ Saved DATABASE_URL to .env.local')

  console.log('\n⏳ Running Drizzle migrations to initialize the schema...')
  try {
    // Run string via pnpm/npm
    execSync('npm run db:push', { stdio: 'inherit' })
    console.log('\n🎉 Database setup complete! You can now run `npm run dev`.')
  } catch (error) {
    console.error('\n❌ Failed to run migrations. Please check your connection string and try again.')
  }

  rl.close()
}

setupDatabase()
