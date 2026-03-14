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
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  const filtered = themes.filter((theme) => {
    const query = search.toLowerCase()
    return theme.name.toLowerCase().includes(query) || theme.id.toLowerCase().includes(query)
  })

  const displayName =
    activeTheme === 'system'
      ? 'Auto'
      : themes.find((theme) => theme.id === activeTheme)?.name ?? activeTheme

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-background/50 px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-background"
      >
        {loading ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Paintbrush className="h-3.5 w-3.5" />
        )}
        <span className="max-w-[80px] truncate">{displayName}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border p-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search themes..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="border-b border-border">
            <button
              onClick={() => {
                onSelect('system')
                setOpen(false)
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium hover:bg-muted"
            >
              <span>Auto (Light / Dark)</span>
              {activeTheme === 'system' && <Check className="h-3 w-3 text-primary" />}
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">No themes found</div>
            ) : (
              filtered.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    onSelect(theme.id)
                    setOpen(false)
                  }}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted"
                >
                  <span className="truncate">{theme.name}</span>
                  {activeTheme === theme.id && <Check className="h-3 w-3 shrink-0 text-primary" />}
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
