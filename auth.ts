import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { compare } from "bcrypt-ts"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" }, // Required for Credentials Provider to work properly in Auth.js
  providers: [
    GitHub,
    Google,
    Credentials({
      credentials: {
        email: { label: "Email / Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Try to find the user by email/username
        const userOrAdmins = await db.select().from(users).where(eq(users.email, credentials.email as string)).limit(1)
        const user = userOrAdmins[0]

        if (!user || (!user.password && user.role !== 'admin')) {
            // User doesn't exist or doesn't have a password (e.g. they only signed in with GitHub)
            return null
        }

        // Only compare passwords if they have one
        if (user.password) {
            const isPasswordValid = await compare(credentials.password as string, user.password)
            if (!isPasswordValid) return null
        }
        
        return {
           id: user.id,
           email: user.email,
           name: user.name,
           image: user.image,
           role: user.role
        }
      }
    })
  ]
})
