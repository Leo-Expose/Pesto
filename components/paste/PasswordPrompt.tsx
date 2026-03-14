'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyPastePassword } from '@/app/actions'
import { Lock, Loader2, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface PasswordPromptProps {
  alias: string
}

export function PasswordPrompt({ alias }: PasswordPromptProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return

    setLoading(true)
    setError(null)

    try {
      const result = await verifyPastePassword(alias, password)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-purple-500/20 blur-[60px] pointer-events-none" />

        <div className="text-center mb-8 relative">
          <div className="h-16 w-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/20 shadow-inner">
            <Lock className="h-8 w-8 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Protected Paste</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            This paste requires a password to view.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <div>
            <Input
              type="password"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full"
              autoFocus
            />
          </div>
          
          {error && (
            <p className="text-red-400 text-sm font-medium text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={!password || loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white border-purple-800 shadow-lg shadow-purple-900/20"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Unlock Paste
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
