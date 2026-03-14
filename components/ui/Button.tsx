import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  className, variant = 'primary', size = 'md',
  children, ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-primary hover:bg-primary/90 text-primary-foreground': variant === 'primary',
          'bg-surface hover:bg-muted text-foreground border border-border': variant === 'secondary',
          'bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-800': variant === 'danger',
          'hover:bg-muted text-muted-foreground': variant === 'ghost',
        },
        {
          'text-xs px-2.5 py-1.5': size === 'sm',
          'text-sm px-4 py-2': size === 'md',
          'text-base px-6 py-3': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
