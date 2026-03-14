import React from 'react'
import { cn } from '@/lib/utils'
import type { PasteVisibility } from '@/types'

const BADGE_STYLES: Record<PasteVisibility, string> = {
  public: 'bg-green-500/15 text-green-400 border-green-800',
  unlisted: 'bg-yellow-500/15 text-yellow-400 border-yellow-800',
  private: 'bg-red-500/15 text-red-400 border-red-800',
  password: 'bg-purple-500/15 text-purple-400 border-purple-800',
}

const BADGE_LABELS: Record<PasteVisibility, string> = {
  public: 'Public',
  unlisted: 'Unlisted',
  private: 'Private',
  password: 'Password Protected',
}

interface VisibilityBadgeProps {
  visibility: PasteVisibility
  className?: string
}

export function VisibilityBadge({ visibility, className }: VisibilityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border',
        BADGE_STYLES[visibility],
        className
      )}
    >
      {BADGE_LABELS[visibility]}
    </span>
  )
}
