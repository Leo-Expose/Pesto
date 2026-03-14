import React from 'react'
import Link from 'next/link'
import { VisibilityBadge } from './VisibilityBadge'
import type { PasteWithAuthor } from '@/types'
import { Clock, Eye } from 'lucide-react'

interface PasteCardProps {
  paste: PasteWithAuthor
  showDelete?: boolean
  onDelete?: (alias: string) => void
}

export function PasteCard({ paste, showDelete, onDelete }: PasteCardProps) {
  const dateObj = new Date(paste.created_at || (paste as any).createdAt)
  const createdAt = isNaN(dateObj.getTime()) 
    ? '' 
    : dateObj.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })

  return (
    <div className="group bg-surface border border-border rounded-xl p-4 hover:border-accent transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/p/${paste.alias}`}
            className="text-foreground font-medium hover:text-primary transition-colors truncate block"
          >
            {paste.title || 'Untitled'}
          </Link>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <VisibilityBadge visibility={paste.visibility} />
            <span className="font-mono text-muted-foreground/80">{paste.language}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {createdAt}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {paste.views}
            </span>
            {paste.author?.username && (
              <span className="text-muted-foreground">by {paste.author.username}</span>
            )}
          </div>
        </div>
        {showDelete && onDelete && (
          <button
            onClick={() => onDelete(paste.alias)}
            className="text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
