import fs from 'fs'
import path from 'path'
import readline from 'readline'
import crypto from 'crypto'
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
  console.log('Welcome to the Pesto setup script.\n')

  const dbTypeInput = await askQuestion('Are you using Local Postgres or Supabase? (postgres/supabase) [postgres]: ')
  const dbType = dbTypeInput.trim().toLowerCase() || 'postgres'

  console.log(`\nSelected database type: ${dbType}`)
  console.log('Please enter your database connection string.')
  console.log('For Local Postgres, it usually looks like: postgresql://user:password@localhost:5432/pesto')
  console.log('For Supabase, use the transaction connection string from Database Settings -> Connection String.\n')

  const dbUrl = await askQuestion('DATABASE_URL: ')

  if (!dbUrl.trim()) {
    console.error('Connection string cannot be empty.')
    process.exit(1)
  }

  let envContent = ''
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
  }

  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${dbUrl.trim()}"`)
  } else {
    envContent += `\nDATABASE_URL="${dbUrl.trim()}"`
  }

  if (!envContent.includes('AUTH_SECRET=')) {
    const secret = crypto.randomBytes(32).toString('hex')
    envContent += `\nAUTH_SECRET="${secret}"`
  }

  fs.writeFileSync(envPath, envContent)
  console.log('\nSaved DATABASE_URL to .env.local')

  console.log('\nRunning Drizzle migrations to initialize the schema...')
  try {
    execSync('npm run db:push', { stdio: 'inherit' })
    console.log('\nDatabase setup complete. You can now run `npm run dev`.')
  } catch {
    console.error('\nFailed to run migrations. Please check your connection string and try again.')
  }

  rl.close()
}

setupDatabase()
