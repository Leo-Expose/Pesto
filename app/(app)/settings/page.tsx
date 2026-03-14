'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { User, Trash2, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react'
import { getSessionUserProfile, updateUsername as updateUsernameAction } from '@/app/actions'

export default function SettingsPage() {
  const [username, setUsername] = useState('')
  const [currentUsername, setCurrentUsername] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const user = await getSessionUserProfile()
      if (!user) {
        setLoading(false)
        return
      }
      setEmail(user.email ?? '')
      setUsername(user.name ?? '')
      setCurrentUsername(user.name ?? '')
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setError(null)
    setMessage(null)
    setSaving(true)
    try {
      const res = await updateUsernameAction(username)
      if (res?.error) {
        setError(res.error)
      } else {
        setMessage('Username updated successfully!')
        setCurrentUsername(username)
      }
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
      </div>
    )
  }

  return (
    <>
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Account"
        description="To permanently delete your account and all associated pastes, please contact an administrator. This feature is currently disabled for self-service."
        confirmText="Understood"
        cancelText="Close"
        onConfirm={() => setDeleteDialogOpen(false)}
        onCancel={() => setDeleteDialogOpen(false)}
      />
      <div className="max-w-2xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences and profile details.</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Card */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border bg-muted/30">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-accent" /> Profile Information
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                <p className="text-foreground font-medium">{email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Connected Provider</p>
                <p className="text-foreground font-medium capitalize flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" /> OAuth Provider
                </p>
              </div>
            </div>

            <div className="h-px bg-border w-full my-4"></div>

            <div className="space-y-4 max-w-sm">
              <Input label="Display Username" id="settings-username" value={username}
                onChange={(e) => setUsername(e.target.value)} placeholder="your-username" />
              
              {message && <p className="text-sm text-green-600 dark:text-green-500 font-medium">{message}</p>}
              {error && <p className="text-sm text-red-600 dark:text-red-500 font-medium">{error}</p>}

              <Button onClick={handleSave} disabled={saving || username === currentUsername || !username.trim()}
                variant="primary" className="w-full sm:w-auto">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/5 dark:bg-red-500/10 border border-red-200 dark:border-red-900/50 rounded-2xl overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-500 flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5" /> Danger Zone
            </h2>
            <p className="text-sm text-red-600/80 dark:text-red-400 mb-6">
              Permanently delete your account and remove all associated pastes from our servers. 
              This action cannot be undone.
            </p>
            <Button variant="danger" onClick={handleDeleteAccount}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete My Account
            </Button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
