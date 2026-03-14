import React from 'react'
import Link from 'next/link'
import { listPublicPastes } from '@/lib/paste'
import { PasteCard } from '@/components/paste/PasteCard'
import { Code2, Plus, Zap, Lock, Globe } from 'lucide-react'

export default async function HomePage() {
  let pastes: Awaited<ReturnType<typeof listPublicPastes>> = []
  try {
    pastes = await listPublicPastes(20)
  } catch {
    // DB may not be set up yet
  }

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Code2 className="h-12 w-12 text-primary" />
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground">Pesto</h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
          A minimalistic, elegant pastebin. Share your code securely with simplicity in mind.
        </p>
        <Link
          href="/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-all duration-200 text-lg shadow-lg shadow-primary/25"
        >
          <Plus className="h-5 w-5" /> New Paste
        </Link>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Zap, title: 'Syntax Highlighting', desc: 'Server-side highlighting with Shiki for 20+ languages' },
          { icon: Lock, title: 'Privacy Controls', desc: 'Public, unlisted, or private — you decide who sees your code' },
          { icon: Globe, title: 'Custom URLs', desc: 'Choose a memorable alias or let us generate one for you' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-surface border border-border rounded-xl p-5 hover:border-accent transition-all">
            <Icon className="h-8 w-8 text-primary mb-3" />
            <h3 className="text-foreground font-semibold mb-1">{title}</h3>
            <p className="text-muted-foreground text-sm">{desc}</p>
          </div>
        ))}
      </section>

      {/* Recent pastes */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">Public Pastes</h2>
        {pastes.length > 0 ? (
          <div className="space-y-2">
            {pastes.map((paste) => (
              <PasteCard key={paste.id} paste={paste} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-surface border border-border rounded-xl">
            <Code2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No pastes yet. Be the first!</p>
          </div>
        )}
      </section>
    </div>
  )
}
