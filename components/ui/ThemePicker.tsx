'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Paintbrush, Search, Check, X } from 'lucide-react'

interface Theme {
  id: string
  name: string
  type: 'bundled'
}

interface ThemePickerProps {
  themes: Theme[]
  activeTheme: string
  onSelect: (id: string) => void
  loading?: boolean
}

export function ThemePicker({ themes, activeTheme, onSelect, loading }: ThemePickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus()
    }
  }, [open])

  const filtered = themes.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase())
  )

  const displayName = activeTheme === 'system' ? 'Auto' : themes.find((t) => t.id === activeTheme)?.name ?? activeTheme

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-md bg-background/50 hover:bg-background border border-border text-foreground transition-colors"
      >
        {loading ? (
          <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Paintbrush className="h-3.5 w-3.5" />
        )}
        <span className="max-w-[80px] truncate">{displayName}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-border flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search themes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* System/Auto option */}
          <div className="border-b border-border">
            <button
              onClick={() => { onSelect('system'); setOpen(false) }}
              className="w-full px-3 py-2 text-xs text-left hover:bg-muted flex items-center justify-between font-medium"
            >
              <span>Auto (Light / Dark)</span>
              {activeTheme === 'system' && <Check className="h-3 w-3 text-primary" />}
            </button>
          </div>

          {/* Theme list */}
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">No themes found</div>
            ) : (
              filtered.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => { onSelect(theme.id); setOpen(false) }}
                  className="w-full px-3 py-1.5 text-xs text-left hover:bg-muted flex items-center justify-between transition-colors"
                >
                  <span className="truncate">{theme.name}</span>
                  {activeTheme === theme.id && <Check className="h-3 w-3 text-primary shrink-0" />}
                </button>
              ))
            )}
          </div>

          <div className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
            {themes.length} themes available
          </div>
        </div>
      )}
    </div>
  )
}
