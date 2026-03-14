'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Code2, Plus, FolderOpen, Settings, LogOut, LogIn, Shield, Sun, Moon, User as UserIcon } from 'lucide-react'
import type { Profile } from '@/types'

interface NavbarProps {
  user: { id: string; email?: string } | null
  profile: Profile | null
}

export function Navbar({ user, profile }: NavbarProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const username = profile?.username || user?.email?.split('@')[0] || 'User'

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Code2 className="h-6 w-6 text-primary group-hover:opacity-80 transition-opacity" />
          <span className="text-lg font-bold text-foreground transition-colors">
            Pesto
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          {user ? (
            <>
              <Link href="/new" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground/80 hover:text-foreground hover:bg-muted rounded-lg transition-all font-medium">
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New</span>
              </Link>
              <Link href="/my-pastes" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground/80 hover:text-foreground hover:bg-muted rounded-lg transition-all">
                <FolderOpen className="h-4 w-4" /> <span className="hidden sm:inline">My Pastes</span>
              </Link>
              {profile?.role === 'admin' && (
                <Link href="/admin" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground/80 hover:text-foreground hover:bg-muted rounded-lg transition-all" title="Admin Panel">
                  <Shield className="h-4 w-4" /> <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              
              <div className="h-5 w-px bg-border mx-1"></div>

              <Link href="/settings" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-all">
                <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                  <UserIcon className="h-3.5 w-3.5" />
                </div>
                <span className="hidden sm:inline">{username}</span>
              </Link>

              <button
                onClick={handleSignOut}
                className="p-2 text-foreground/60 hover:text-red-500 hover:bg-muted rounded-lg transition-all"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-accent hover:bg-accent-hover text-white rounded-lg transition-all font-medium"
              id="sign-in-btn"
            >
              <LogIn className="h-4 w-4" /> Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
