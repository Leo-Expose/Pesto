import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  trustHost: true,
  providers: [],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
        if (user) { 
          token.role = user.role
        }
        return token
      },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as string
      }
      return session
    }
  }
} satisfies NextAuthConfig
