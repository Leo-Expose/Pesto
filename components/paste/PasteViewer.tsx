'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { VisibilityBadge } from './VisibilityBadge'
import { Button } from '@/components/ui/Button'
import { ThemePicker } from '@/components/ui/ThemePicker'
import type { PasteWithAuthor } from '@/types'
import { Copy, Check, Link as LinkIcon, Download, Pencil, Trash2, Clock, Eye, User, GitFork, History } from 'lucide-react'
import { useState, useEffect } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { VersionHistory } from '@/components/paste/VersionHistory'
import { rehighlightPaste, incrementPasteView } from '@/app/actions'

interface Theme {
  id: string
  name: string
  type: 'bundled'
}

interface PasteViewerProps {
  paste: PasteWithAuthor
  highlightedHtml: string
  isOwner: boolean
  isMarkdown?: boolean
  isBurned?: boolean
}

export function PasteViewer({ paste, highlightedHtml, isOwner, isMarkdown, isBurned }: PasteViewerProps) {
  const [copied, setCopied] = useState<'content' | 'link' | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  
  // Theme state
  const [currentHtml, setCurrentHtml] = useState(highlightedHtml)
  const [themeLoading, setThemeLoading] = useState(false)
  const [activeTheme, setActiveTheme] = useState('system')
  const [themes, setThemes] = useState<Theme[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    incrementPasteView(paste.alias.toLowerCase()).catch(() => {})
  }, [paste.alias])

  // Fetch available themes on mount
  useEffect(() => {
    fetch('/api/themes')
      .then((res) => res.json())
      .then((data) => setThemes(data.themes ?? []))
      .catch(() => {})
  }, [])

  const changeTheme = async (theme: string) => {
    setActiveTheme(theme)
    if (theme === 'system') {
      setCurrentHtml(highlightedHtml)
      return
    }
    
    setThemeLoading(true)
    const res = await rehighlightPaste(paste.alias, theme)
    if (res.html) setCurrentHtml(res.html)
    setThemeLoading(false)
  }

  const copyContent = async () => {
    await navigator.clipboard.writeText(paste.content)
    setCopied('content')
    setTimeout(() => setCopied(null), 2000)
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/p/${paste.alias}`)
    setCopied('link')
    setTimeout(() => setCopied(null), 2000)
  }

  const createdAtValue = (paste as any).createdAt || paste.created_at || new Date().toISOString()
  const createdAt = new Date(createdAtValue).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const handleDelete = async () => {
    const res = await fetch(`/api/pastes/${paste.alias}`, { method: 'DELETE' })
    if (res.ok) window.location.href = '/my-pastes'
    setDeleteConfirmOpen(false)
  }

  return (
    <>
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Paste"
        description="Are you sure you want to delete this paste? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
      
      {isBurned && (
        <div className="bg-orange-500/10 border border-orange-500/50 text-orange-400 p-4 rounded-xl flex items-center gap-3">
          <Clock className="h-6 w-6 shrink-0" />
          <p className="text-sm">
            <strong>Burn After Reading:</strong> This paste has self-destructed and is no longer available on the server. If you refresh, it will be gone forever.
          </p>
        </div>
      )}

      <div className="space-y-6 max-w-[100vw] overflow-hidden">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">{paste.title}</h1>
            {paste.parent && (
              <a href={`/p/${paste.parent.alias}`} className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1.5 mt-1 transition-colors">
                <GitFork className="h-3.5 w-3.5" /> Forked from: {paste.parent.title}
              </a>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <VisibilityBadge visibility={paste.visibility} />
            <div className="flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded-md font-medium text-foreground">
              <span className="w-2 h-2 rounded-full bg-accent"></span>
              {paste.language}
            </div>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {createdAt}</span>
            <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {paste.views || 0} views</span>
            {paste.author?.username && (
              <span className="flex items-center gap-1.5 text-foreground font-medium">
                <User className="h-4 w-4 text-accent" /> {paste.author.username}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Editor Window */}
      <div className={cn(
        "rounded-xl border border-border overflow-hidden shadow-2xl bg-surface",
        isMarkdown ? 'p-8 prose prose-invert max-w-none' : ''
      )}>
        {/* Mac OS Style Header Bar */}
        {!isMarkdown && (
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {!isMarkdown && (
                <div className="hidden sm:block">
                  <ThemePicker
                    themes={themes}
                    activeTheme={activeTheme}
                    onSelect={changeTheme}
                    loading={themeLoading}
                  />
                </div>
              )}
              
              <Button size="sm" variant="secondary" onClick={copyContent} className="h-8 text-xs bg-background/50 hover:bg-background">
                {copied === 'content' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{copied === 'content' ? 'Copied' : 'Copy Code'}</span>
              </Button>
              <Button size="sm" variant="secondary" onClick={copyLink} className="h-8 text-xs bg-background/50 hover:bg-background">
                {copied === 'link' ? <Check className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Share</span>
              </Button>
              <a href={`/raw/${paste.alias}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="secondary" className="h-8 text-xs bg-background/50 hover:bg-background">
                  <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Raw</span>
                </Button>
              </a>
              <a href={`/new?fork=${paste.alias}`}>
                <Button size="sm" variant="secondary" className="h-8 text-xs bg-background/50 hover:bg-background border-purple-500/30 text-purple-400 hover:text-purple-300">
                  <GitFork className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Fork</span>
                </Button>
              </a>
              <Button size="sm" variant="secondary" onClick={() => setHistoryOpen(true)} className="h-8 text-xs bg-background/50 hover:bg-background">
                <History className="h-3.5 w-3.5" /> <span className="hidden sm:inline">History</span>
              </Button>
              {isOwner && (
                <>
                  <a href={`/new?edit=${paste.alias}`}>
                    <Button size="sm" variant="secondary" className="h-8 text-xs bg-background/50 hover:bg-background">
                      <Pencil className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </a>
                  <Button size="sm" variant="danger" className="h-8 text-xs" onClick={() => setDeleteConfirmOpen(true)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        <div
          role="region"
          aria-label={`Code: ${paste.title}`}
          className={cn(!isMarkdown && 'relative', themeLoading && 'opacity-50 transition-opacity')}
          dangerouslySetInnerHTML={{ __html: currentHtml }}
        />
      </div>
    </div>
    <VersionHistory
      pasteAlias={paste.alias}
      isOpen={historyOpen}
      onClose={() => setHistoryOpen(false)}
    />
    </>
  )
}
