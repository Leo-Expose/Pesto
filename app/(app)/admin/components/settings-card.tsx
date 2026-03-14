'use client'

import { useState, useEffect } from 'react'
import { toggleRegistrations, toggleOAuthProvider, updateInstanceSettings } from '../actions'
import { Github, Settings2 } from 'lucide-react'

interface SettingsProps {
  initialSettings: {
    allowRegistrations: boolean
    enableGithub: boolean
    enableGoogle: boolean
    instanceName: string
    defaultTheme: string
    maxPasteSize: number
  }
}

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 ${
        checked ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export function SettingsCard({ initialSettings }: SettingsProps) {
  const [allowRegistrations, setAllowRegistrations] = useState(initialSettings.allowRegistrations)
  const [enableGithub, setEnableGithub] = useState(initialSettings.enableGithub)
  const [enableGoogle, setEnableGoogle] = useState(initialSettings.enableGoogle)
  const [isPending, setIsPending] = useState<string | null>(null)

  // Instance settings
  const [instanceName] = useState(initialSettings.instanceName)
  const [defaultTheme, setDefaultTheme] = useState(initialSettings.defaultTheme)
  const [maxPasteSize, setMaxPasteSize] = useState(initialSettings.maxPasteSize)
  const [instanceSaved, setInstanceSaved] = useState(false)
  const [themes, setThemes] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch('/api/themes')
      .then((res) => res.json())
      .then((data) => setThemes(data.themes ?? []))
      .catch(() => {})
  }, [])

  const handleToggleRegistrations = async () => {
    setIsPending('reg')
    try {
      await toggleRegistrations(allowRegistrations)
      setAllowRegistrations(!allowRegistrations)
    } catch (e) {
      console.error(e)
      alert("Failed to toggle setting.")
    } finally {
      setIsPending(null)
    }
  }

  const handleToggleGithub = async () => {
    setIsPending('github')
    try {
      await toggleOAuthProvider('github', enableGithub)
      setEnableGithub(!enableGithub)
    } catch (e) {
      console.error(e)
      alert("Failed to toggle GitHub. Make sure AUTH_GITHUB_ID and AUTH_GITHUB_SECRET are set in .env.local")
    } finally {
      setIsPending(null)
    }
  }

  const handleToggleGoogle = async () => {
    setIsPending('google')
    try {
      await toggleOAuthProvider('google', enableGoogle)
      setEnableGoogle(!enableGoogle)
    } catch (e) {
      console.error(e)
      alert("Failed to toggle Google. Make sure AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are set in .env.local")
    } finally {
      setIsPending(null)
    }
  }

  const handleSaveInstance = async () => {
    setIsPending('instance')
    try {
      await updateInstanceSettings({ instanceName, defaultTheme, maxPasteSize })
      setInstanceSaved(true)
      setTimeout(() => setInstanceSaved(false), 2000)
    } catch (e) {
      console.error(e)
      alert("Failed to save instance settings.")
    } finally {
      setIsPending(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Auth & Registration Settings */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h3 className="text-lg font-semibold text-foreground">Authentication & Access</h3>
        </div>
        
        <div className="divide-y divide-border">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Allow New Registrations</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                When disabled, only admins can create new accounts manually.
              </p>
            </div>
            <ToggleSwitch checked={allowRegistrations} onChange={handleToggleRegistrations} disabled={isPending === 'reg'} />
          </div>

          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Github className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">GitHub Sign-In</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {enableGithub ? 'Shown on login page' : 'Hidden from login page'}
                </p>
              </div>
            </div>
            <ToggleSwitch checked={enableGithub} onChange={handleToggleGithub} disabled={isPending === 'github'} />
          </div>

          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              <div>
                <p className="font-medium text-foreground">Google Sign-In</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {enableGoogle ? 'Shown on login page' : 'Hidden from login page'}
                </p>
              </div>
            </div>
            <ToggleSwitch checked={enableGoogle} onChange={handleToggleGoogle} disabled={isPending === 'google'} />
          </div>
        </div>
      </div>

      {/* Instance Settings */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" /> Instance Settings
          </h3>
        </div>
        
        <div className="p-6 space-y-5">

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Default Syntax Theme</label>
            <select
              value={defaultTheme}
              onChange={(e) => setDefaultTheme(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {themes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Default theme for code highlighting across all pastes.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Max Paste Size (bytes)</label>
            <input
              type="number"
              value={maxPasteSize}
              onChange={(e) => setMaxPasteSize(parseInt(e.target.value) || 1048576)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              min={1024}
              max={52428800}
            />
            <p className="text-xs text-muted-foreground">Maximum size per paste in bytes. Default: 1,048,576 (1 MB).</p>
          </div>

          <button
            onClick={handleSaveInstance}
            disabled={isPending === 'instance'}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isPending === 'instance' ? 'Saving…' : instanceSaved ? '✓ Saved' : 'Save Instance Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
