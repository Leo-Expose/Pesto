'use client'

import React, { useState } from 'react'
import { Code2, Database, Shield, Key, CheckCircle2, Loader2, AlertCircle, ChevronRight, Github, ExternalLink } from 'lucide-react'

type Step = 'database' | 'schema' | 'admin' | 'oauth' | 'done'

export default function SetupPage() {
  const [step, setStep] = useState<Step>('database')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Database step
  const [dbUrl, setDbUrl] = useState('')
  const [dbTested, setDbTested] = useState(false)

  // Admin step
  const [adminEmail, setAdminEmail] = useState('')
  const [adminName, setAdminName] = useState('Administrator')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('')

  // OAuth step
  const [enableGithub, setEnableGithub] = useState(false)
  const [githubId, setGithubId] = useState('')
  const [githubSecret, setGithubSecret] = useState('')
  const [enableGoogle, setEnableGoogle] = useState(false)
  const [googleId, setGoogleId] = useState('')
  const [googleSecret, setGoogleSecret] = useState('')

  // Result
  const [needsRestart, setNeedsRestart] = useState(false)

  const testDb = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/setup/test-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: dbUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error)
      setDbTested(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const pushSchema = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/setup/push-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: dbUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error)
      setStep('admin')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const completeSetup = async () => {
    if (adminPassword !== adminPasswordConfirm) {
      setError('Passwords do not match')
      return
    }
    if (adminPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail,
          adminPassword,
          adminName,
          enableGithub,
          enableGoogle,
          githubId: enableGithub ? githubId : undefined,
          githubSecret: enableGithub ? githubSecret : undefined,
          googleId: enableGoogle ? googleId : undefined,
          googleSecret: enableGoogle ? googleSecret : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error)
      setNeedsRestart(data.needsRestart)
      setStep('done')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: 'database', label: 'Database', icon: <Database className="h-4 w-4" /> },
    { id: 'schema', label: 'Schema', icon: <Database className="h-4 w-4" /> },
    { id: 'admin', label: 'Admin', icon: <Shield className="h-4 w-4" /> },
    { id: 'oauth', label: 'OAuth', icon: <Key className="h-4 w-4" /> },
    { id: 'done', label: 'Done', icon: <CheckCircle2 className="h-4 w-4" /> },
  ]

  const currentIdx = steps.findIndex(s => s.id === step)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Code2 className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Pesto Setup</h1>
          </div>
          <p className="text-muted-foreground">Configure your self-hosted Pesto instance</p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                i < currentIdx ? 'bg-green-500/20 text-green-500' :
                i === currentIdx ? 'bg-primary/20 text-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {i < currentIdx ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.icon}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </React.Fragment>
          ))}
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Error</p>
              <p className="text-sm opacity-90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl">
          {/* STEP 1: Database */}
          {step === 'database' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" /> Database Connection
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your PostgreSQL connection string. This can be a local Postgres instance, Supabase, Neon, or any PostgreSQL-compatible database.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">Connection String</label>
                <input
                  type="text"
                  value={dbUrl}
                  onChange={e => { setDbUrl(e.target.value); setDbTested(false); setError(null) }}
                  placeholder="postgresql://user:password@localhost:5432/pesto"
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  For Supabase: Find this in Project Settings → Database → Connection String (Transaction mode).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={testDb}
                  disabled={loading || !dbUrl.trim()}
                  className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                  Test Connection
                </button>

                {dbTested && (
                  <span className="text-green-500 text-sm flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-4 w-4" /> Connection successful
                  </span>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => { setError(null); setStep('schema') }}
                  disabled={!dbTested}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Schema Push */}
          {step === 'schema' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" /> Initialize Database
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  This will create all necessary tables in your database. If the tables already exist, they will be updated safely.
                </p>
              </div>

              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <p className="text-sm text-foreground font-medium mb-1">The following tables will be created:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li><code className="text-foreground">user</code> — User accounts and credentials</li>
                  <li><code className="text-foreground">account</code> — OAuth provider links (NextAuth)</li>
                  <li><code className="text-foreground">session</code> — Active sessions (NextAuth)</li>
                  <li><code className="text-foreground">verificationToken</code> — Email verification tokens</li>
                  <li><code className="text-foreground">pastes</code> — Code snippets and paste data</li>
                  <li><code className="text-foreground">app_settings</code> — Global application settings</li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setStep('database')}
                  className="px-4 py-2.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  ← Back
                </button>
                <button
                  onClick={pushSchema}
                  disabled={loading}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {loading ? 'Initializing...' : 'Initialize Database'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Admin Account */}
          {step === 'admin' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> Create Admin Account
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Set up the administrator account. You&apos;ll use these credentials to log in and manage the instance.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Display Name</label>
                  <input value={adminName} onChange={e => setAdminName(e.target.value)}
                    placeholder="Administrator" type="text"
                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email Address</label>
                  <input value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                    placeholder="admin@example.com" type="email" required
                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                    <input value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
                      placeholder="Min 8 characters" type="password" required
                      className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label>
                    <input value={adminPasswordConfirm} onChange={e => setAdminPasswordConfirm(e.target.value)}
                      placeholder="Repeat password" type="password" required
                      className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button onClick={() => setStep('schema')} className="px-4 py-2.5 text-muted-foreground hover:text-foreground transition-colors text-sm">← Back</button>
                <button
                  onClick={() => { setError(null); setStep('oauth') }}
                  disabled={!adminEmail || !adminPassword || adminPassword.length < 8}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: OAuth */}
          {step === 'oauth' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" /> OAuth Providers (Optional)
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enable social login with GitHub and/or Google. You can skip this step and configure it later in the Admin Dashboard.
                </p>
              </div>

              {/* GitHub */}
              <div className={`border rounded-xl p-5 transition-all ${enableGithub ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Github className="h-5 w-5" />
                    <div>
                      <p className="font-medium text-foreground">GitHub</p>
                      <p className="text-xs text-muted-foreground">Sign in with GitHub accounts</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input type="checkbox" checked={enableGithub} onChange={e => setEnableGithub(e.target.checked)} className="peer sr-only" />
                    <div className="w-10 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                </label>
                {enableGithub && (
                  <div className="mt-4 space-y-3">
                    <a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      Create a GitHub OAuth App <ExternalLink className="h-3 w-3" />
                    </a>
                    <input value={githubId} onChange={e => setGithubId(e.target.value)} placeholder="Client ID"
                      className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm font-mono" />
                    <input value={githubSecret} onChange={e => setGithubSecret(e.target.value)} placeholder="Client Secret" type="password"
                      className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm font-mono" />
                  </div>
                )}
              </div>

              {/* Google */}
              <div className={`border rounded-xl p-5 transition-all ${enableGoogle ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    <div>
                      <p className="font-medium text-foreground">Google</p>
                      <p className="text-xs text-muted-foreground">Sign in with Google accounts</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input type="checkbox" checked={enableGoogle} onChange={e => setEnableGoogle(e.target.checked)} className="peer sr-only" />
                    <div className="w-10 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                </label>
                {enableGoogle && (
                  <div className="mt-4 space-y-3">
                    <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      Create a Google OAuth Client <ExternalLink className="h-3 w-3" />
                    </a>
                    <input value={googleId} onChange={e => setGoogleId(e.target.value)} placeholder="Client ID"
                      className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm font-mono" />
                    <input value={googleSecret} onChange={e => setGoogleSecret(e.target.value)} placeholder="Client Secret" type="password"
                      className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm font-mono" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4">
                <button onClick={() => setStep('admin')} className="px-4 py-2.5 text-muted-foreground hover:text-foreground transition-colors text-sm">← Back</button>
                <button
                  onClick={completeSetup}
                  disabled={loading}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {loading ? 'Completing Setup...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Done */}
          {step === 'done' && (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Setup Complete!</h2>
                <p className="text-muted-foreground mt-2">
                  Your Pesto instance is ready to use.
                </p>
              </div>

              {needsRestart && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 rounded-xl text-sm">
                  <p className="font-medium">⚠️ Restart Required</p>
                  <p className="mt-1">OAuth environment variables were written to <code className="bg-muted px-1 rounded">.env.local</code>. Please restart the server for them to take effect.</p>
                  <p className="mt-2 font-mono text-xs opacity-80">Press Ctrl+C, then run: npm run dev</p>
                </div>
              )}

              <div className="bg-muted/30 rounded-xl p-5 text-left space-y-3">
                <p className="font-medium text-foreground text-sm">Your admin credentials:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-foreground font-mono">{adminEmail}</span>
                  <span className="text-muted-foreground">Password:</span>
                  <span className="text-foreground">••••••••</span>
                </div>
              </div>

              <a
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Go to Login <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Pesto — Self-Hosted Code Paste Service
        </p>
      </div>
    </div>
  )
}
