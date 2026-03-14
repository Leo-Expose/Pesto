'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { VisibilityBadge } from '@/components/paste/VisibilityBadge'
import { Shield, FileCode, Users, Trash2, Pencil } from 'lucide-react'

interface AdminPaste {
  id: string
  title: string
  alias: string
  visibility: 'public' | 'unlisted' | 'private' | 'password'
  language: string
  created_at: string
  views: number
  author?: { username: string | null } | null
}

interface AdminDashboardProps {
  initialPastes: AdminPaste[]
  stats: {
    totalPastes: number
    totalUsers: number
    totalViews: number
  }
}

export function AdminDashboard({ initialPastes, stats }: AdminDashboardProps) {
  const [pastes, setPastes] = useState(initialPastes)
  const [pasteToDelete, setPasteToDelete] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const confirmDeletePaste = async () => {
    if (!pasteToDelete) return
    const res = await fetch(`/api/pastes/${pasteToDelete}`, { method: 'DELETE' })
    if (res.ok) setPastes((p) => p.filter((x) => x.alias !== pasteToDelete))
    setPasteToDelete(null)
  }

  const filteredPastes = pastes.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.author?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <ConfirmDialog
        isOpen={!!pasteToDelete}
        title="Delete Paste"
        description="Are you sure you want to delete this paste? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDeletePaste}
        onCancel={() => setPasteToDelete(null)}
      />
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" /> Admin Dashboard
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <FileCode className="h-4 w-4" /> Total Pastes
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalPastes}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Users className="h-4 w-4" /> Total Users
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <FileCode className="h-4 w-4" /> Total Views
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalViews}</p>
          </div>
        </div>

        {/* Pastes with search */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-4">
            <h2 className="font-semibold text-foreground">All Pastes</h2>
            <input
              type="text"
              placeholder="Search pastes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground w-64 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {filteredPastes.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                {searchQuery ? 'No pastes match your search.' : 'No pastes found.'}
              </div>
            ) : (
              filteredPastes.map((paste) => (
                <div key={paste.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <a href={`/p/${paste.alias}`} className="text-sm text-foreground hover:text-primary truncate block font-medium">
                      {paste.title}
                    </a>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <VisibilityBadge visibility={paste.visibility} />
                      <span className="font-mono">{paste.alias}</span>
                      <span>·</span>
                      <span>{paste.language}</span>
                      <span>·</span>
                      <span>{paste.author?.username ?? 'anonymous'}</span>
                      <span>·</span>
                      <span>{paste.views} views</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-4">
                    <a href={`/new?edit=${paste.alias}`}>
                      <Button size="sm" variant="secondary" className="h-7">
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </a>
                    <Button size="sm" variant="danger" className="h-7" onClick={() => setPasteToDelete(paste.alias)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
