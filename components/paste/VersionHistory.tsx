'use client'

import React, { useState, useEffect } from 'react'
import { Clock, ChevronRight, User, Loader2, X } from 'lucide-react'

interface VersionSummary {
  id: string
  version: number
  title: string | null
  language: string | null
  editorName: string | null
  createdAt: string
}

interface VersionHistoryProps {
  pasteAlias: string
  isOpen: boolean
  onClose: () => void
}

export function VersionHistory({ pasteAlias, isOpen, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<VersionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [versionHtml, setVersionHtml] = useState<string | null>(null)
  const [versionLoading, setVersionLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch(`/api/pastes/${pasteAlias}/versions`)
      .then((res) => res.json())
      .then((data) => setVersions(data.versions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isOpen, pasteAlias])

  const viewVersion = async (versionNum: number) => {
    setSelectedVersion(versionNum)
    setVersionLoading(true)
    try {
      const res = await fetch(`/api/pastes/${pasteAlias}/versions?version=${versionNum}`)
      const data = await res.json()
      setVersionHtml(data.html ?? null)
    } catch {
      setVersionHtml(null)
    } finally {
      setVersionLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Version History</h2>
            {!loading && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {versions.length} version{versions.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Version List */}
          <div className="w-72 border-r border-border overflow-y-auto shrink-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
              </div>
            ) : versions.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                No edit history yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {versions.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => viewVersion(v.version)}
                    className={`w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3 ${
                      selectedVersion === v.version ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
                          v{v.version}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {v.title ?? 'Untitled'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {v.editorName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" /> {v.editorName}
                          </span>
                        )}
                        <span>{new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Version Content */}
          <div className="flex-1 overflow-auto">
            {selectedVersion === null ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <Clock className="h-8 w-8 opacity-50" />
                <p className="text-sm">Select a version to view its content</p>
              </div>
            ) : versionLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
              </div>
            ) : versionHtml ? (
              <div
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: versionHtml }}
              />
            ) : (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                Failed to load version content.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
