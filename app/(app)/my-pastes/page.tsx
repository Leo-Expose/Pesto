'use client'

import React, { useState, useEffect } from 'react'
import { PasteCard } from '@/components/paste/PasteCard'
import { Code2, Loader2 } from 'lucide-react'
import type { PasteWithAuthor } from '@/types'
import Link from 'next/link'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export default function MyPastesPage() {
  const [pastes, setPastes] = useState<PasteWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [pasteToDelete, setPasteToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/user/pastes')
      .then((res) => res.json())
      .then((json) => setPastes(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const confirmDeletePaste = async () => {
    if (!pasteToDelete) return
    const res = await fetch(`/api/pastes/${pasteToDelete}`, { method: 'DELETE' })
    if (res.ok) {
      setPastes((prev) => prev.filter((p) => p.alias !== pasteToDelete))
    }
    setPasteToDelete(null)
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
        isOpen={!!pasteToDelete}
        title="Delete Paste"
        description="Are you sure you want to delete this paste permanently? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDeletePaste}
        onCancel={() => setPasteToDelete(null)}
      />
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">My Pastes</h1>
      {pastes.length > 0 ? (
        <div className="space-y-2">
          {pastes.map((paste) => (
            <PasteCard key={paste.id} paste={paste} showDelete onDelete={() => setPasteToDelete(paste.alias)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-surface border border-border rounded-xl">
          <Code2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">You haven&apos;t created any pastes yet.</p>
          <Link
            href="/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-all text-sm"
          >
            Create your first paste
          </Link>
        </div>
      )}
      </div>
    </>
  )
}
