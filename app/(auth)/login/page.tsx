'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { Code2, Github, AlertCircle } from 'lucide-react'
import { registerLocalAccount } from './actions'
import type { AppSettings } from '@/types'

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(setSettings)
      .catch(() => {})
  }, [])

  const handleOAuth = async (provider: 'github' | 'google') => {
    setIsLoading(true)
    const params = new URLSearchParams(window.location.search)
    const redirectUrl = params.get('redirect') || '/new'
    await signIn(provider, { callbackUrl: redirectUrl })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      if (isRegistering) {
        const res = await registerLocalAccount(formData)
        if (res?.error) {
          setError(res.error)
          setIsLoading(false)
          return
        }
      }

      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        setError("Invalid email or password.")
        setIsLoading(false)
      } else {
        const params = new URLSearchParams(window.location.search)
        const redirectUrl = params.get('redirect') || '/new'
        window.location.href = redirectUrl
      }
    } catch (err) {
      setError("An unexpected error occurred.")
      setIsLoading(false)
    }
  }

  const showGithub = settings?.enableGithub ?? false
  const showGoogle = settings?.enableGoogle ?? false
  const showOAuthSection = showGithub || showGoogle
  const allowRegistrations = settings?.allowRegistrations ?? true

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Code2 className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Pesto</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {isRegistering ? 'Create your account' : 'Sign in to manage your pastes'}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-8 space-y-6 shadow-2xl">
          {error && (
            <div className="p-3 text-sm bg-red-500/10 border border-red-500/20 text-red-500 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <input
                name="email"
                type="text"
                required
                placeholder="admin@example.com"
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Please wait...' : (isRegistering ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {showOAuthSection && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-surface px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="space-y-3">
                {showGithub && (
                  <button
                    onClick={() => handleOAuth('github')}
                    type="button"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors border border-border"
                  >
                    <Github className="h-5 w-5" />
                    GitHub
                  </button>
                )}

                {showGoogle && (
                  <button
                    onClick={() => handleOAuth('google')}
                    type="button"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors border border-border"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </button>
                )}
              </div>
            </>
          )}

          {allowRegistrations && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-primary hover:underline font-medium"
              >
                {isRegistering ? 'Sign in' : 'Register here'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
