'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Send, Loader2, ImagePlus, Eye, EyeOff } from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { loadLanguageExtension } from '@/lib/codemirror-langs'
import type { Extension } from '@codemirror/state'

const LANGUAGES = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'text', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'bash', label: 'Bash' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'sql', label: 'SQL' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'xml', label: 'XML' },
]

const VISIBILITY = [
  { value: 'public', label: 'Public' },
  { value: 'unlisted', label: 'Unlisted' },
  { value: 'private', label: 'Private' },
  { value: 'password', label: 'Password Protected' },
]

const EXPIRY = [
  { value: 'never', label: 'Never' },
  { value: '1h', label: '1 Hour' },
  { value: '1d', label: '1 Day' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
]

export default function NewPastePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editAlias = searchParams.get('edit')
  const forkAlias = searchParams.get('fork')
  
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => setMounted(true), [])
  const currentTheme = theme === 'system' ? systemTheme : theme

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [language, setLanguage] = useState('auto')
  const [visibility, setVisibility] = useState('public')
  const [password, setPassword] = useState('')
  const [burnAfterReading, setBurnAfterReading] = useState(false)
  const [expiry, setExpiry] = useState('never')
  const [alias, setAlias] = useState('')
  const [forkedFromId, setForkedFromId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  // Dynamic CodeMirror language extension
  const [langExtension, setLangExtension] = useState<Extension[]>([])

  // Load language extension when language changes
  useEffect(() => {
    const lang = language === 'auto' ? 'text' : language
    loadLanguageExtension(lang).then((ext) => {
      setLangExtension(ext ? [ext] : [])
    })
  }, [language])

  // Live preview — debounced re-highlight
  useEffect(() => {
    if (!showPreview || !content.trim()) {
      setPreviewHtml('')
      return
    }

    const timeout = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const { rehighlightContent } = await import('@/app/actions')
        const lang = language === 'auto' ? 'text' : language
        const res = await rehighlightContent(content, lang)
        if (res.html) setPreviewHtml(res.html)
      } catch {
        setPreviewHtml('')
      } finally {
        setPreviewLoading(false)
      }
    }, 1000)

    return () => clearTimeout(timeout)
  }, [content, language, showPreview])

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!res.ok) throw new Error('Upload failed')

      const { url } = await res.json()
      
      const markdownImage = `\n![attachment](${url})\n`
      setContent(prev => prev + markdownImage)
      if (language === 'auto' || language === 'text') setLanguage('markdown')
    } catch (err: any) {
      console.error(err)
      setError('Failed to upload image. Make sure you are logged in.')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  useEffect(() => {
    if (editAlias || forkAlias) {
      const targetAlias = editAlias || forkAlias
      fetch(`/api/pastes/${targetAlias}`).then(async (res) => {
        if (res.ok) {
          const { data } = await res.json()
          setTitle(forkAlias ? `Fork of ${data.title}` : (data.title ?? ''))
          setContent(data.content ?? '')
          setLanguage(data.language ?? 'text')
          
          if (editAlias) {
            setVisibility(data.visibility ?? 'public')
          }
          if (forkAlias && data.id) {
            setForkedFromId(data.id)
          }
        }
      }).catch(() => {})
    }
  }, [editAlias, forkAlias])

  const handleSubmit = useCallback(async () => {
    setError(null)
    setFieldErrors({})
    setLoading(true)

    try {
      if (editAlias) {
        const res = await fetch(`/api/pastes/${editAlias}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, language, visibility }),
        })
        if (!res.ok) {
          const json = await res.json()
          setError(json.error ?? 'Something went wrong')
          if (json.fields) setFieldErrors(json.fields)
          return
        }
        router.push(`/p/${editAlias}`)
      } else {
        const body: Record<string, any> = { title, content, language, visibility, expiry, burn_after_reading: burnAfterReading }
        if (alias.trim()) body.alias = alias.trim()
        if (visibility === 'password' && password) body.password = password
        if (forkedFromId) body.forked_from = forkedFromId

        const res = await fetch('/api/pastes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const json = await res.json()
          setError(json.error ?? 'Something went wrong')
          if (json.fields) setFieldErrors(json.fields)
          return
        }
        const json = await res.json()
        router.push(`/p/${json.alias}`)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [title, content, language, visibility, expiry, alias, password, burnAfterReading, forkedFromId, editAlias, router])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleSubmit])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        {editAlias ? 'Edit Paste' : 'Create New Paste'}
      </h1>

      {error && (
        <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Input label="Title" id="paste-title" placeholder="My awesome snippet" value={title}
        onChange={(e) => setTitle(e.target.value)} error={fieldErrors.title?.[0]} />

      <div className="flex justify-between items-end mb-1.5 -mt-2">
        <label htmlFor="paste-content" className="sr-only">Content</label>
        <div className="flex-1" />
        <div className="flex items-center gap-2 z-10">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={`h-8 text-xs ${showPreview ? 'bg-primary/20 text-primary border-primary/30' : 'bg-muted/50 hover:bg-muted text-foreground'}`}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="h-3.5 w-3.5 mr-1.5" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
            <span>{showPreview ? 'Hide Preview' : 'Live Preview'}</span>
          </Button>
          <input type="file" accept="image/png, image/jpeg, image/gif, image/webp" id="image-upload" className="hidden" onChange={uploadImage} />
          <Button type="button" variant="secondary" size="sm" className="h-8 text-xs bg-muted/50 hover:bg-muted text-foreground" disabled={uploadingImage} onClick={() => document.getElementById('image-upload')?.click()}>
            {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <ImagePlus className="h-3.5 w-3.5 mr-1.5" />}
            <span>{uploadingImage ? 'Uploading...' : 'Insert Image'}</span>
          </Button>
        </div>
      </div>

      <div className={`grid gap-4 mt-0 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Editor */}
        <div className="space-y-1.5 focus-within:ring-2 focus-within:ring-primary rounded-xl overflow-hidden border border-border transition-all duration-200">
          <CodeMirror
            value={content}
            height={showPreview ? '350px' : '400px'}
            theme={mounted && currentTheme === 'light' ? 'light' : oneDark}
            extensions={langExtension}
            onChange={(val) => setContent(val)}
            className="text-sm font-mono"
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              foldGutter: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              closeBracketsKeymap: true,
              defaultKeymap: true,
              searchKeymap: true,
              historyKeymap: true,
              foldKeymap: true,
              completionKeymap: true,
              lintKeymap: true,
            }}
          />
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="rounded-xl border border-border overflow-hidden bg-surface">
            <div className="px-3 py-2 bg-muted/30 border-b border-border flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Preview</span>
              {previewLoading && <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />}
            </div>
            <div className="overflow-auto max-h-[350px]">
              {previewHtml ? (
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                  {content.trim() ? 'Generating preview…' : 'Start typing to see a live preview'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-xs">
        <div className="flex gap-2">
           {fieldErrors.content?.map((err, i) => (
             <span key={i} className="text-destructive">{err}</span>
           ))}
        </div>
        <span className="text-muted-foreground">
          {new TextEncoder().encode(content).length.toLocaleString()} / 1,048,576 bytes
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select label="Language" id="paste-language" options={LANGUAGES}
          value={language} onChange={(e) => setLanguage(e.target.value)} />
        <Select label="Visibility" id="paste-visibility" options={VISIBILITY}
          value={visibility} onChange={(e) => setVisibility(e.target.value)} />
        {!editAlias && (
          <Select label="Expiration" id="paste-expiry" options={EXPIRY}
            value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        )}
        {!editAlias && (
          <Input label="Custom Alias (optional)" id="paste-alias"
            placeholder="my-cool-snippet" value={alias}
            onChange={(e) => setAlias(e.target.value)} error={fieldErrors.alias?.[0]} />
        )}
      </div>

      {visibility === 'password' && (
        <div className="max-w-xs">
          <Input 
            label="Paste Password" 
            id="paste-password" 
            type="password"
            placeholder="SuperSecret123!" 
            value={password}
            onChange={(e) => setPassword(e.target.value)} 
            error={fieldErrors.password?.[0]} 
          />
        </div>
      )}

      {!editAlias && (
        <label className="flex items-center gap-3 cursor-pointer group w-fit">
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              checked={burnAfterReading}
              onChange={(e) => setBurnAfterReading(e.target.checked)}
              className="peer sr-only"
            />
            <div className="w-10 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
          </div>
          <span className="text-sm font-medium text-foreground group-hover:text-orange-400 transition-colors">
            Burn after reading (Single View)
          </span>
        </label>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSubmit} disabled={loading || !content.trim()} size="lg" id="submit-paste-btn">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {editAlias ? 'Update Paste' : 'Create Paste'}
        </Button>
        <span className="text-xs text-muted-foreground">Ctrl+Enter to submit</span>
      </div>
    </div>
  )
}
