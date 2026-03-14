export type PasteVisibility = 'public' | 'unlisted' | 'private' | 'password'
export type PasteExpiry = '1h' | '1d' | '7d' | '30d' | 'never'

export interface Paste {
  id: string
  user_id: string | null
  title: string
  content: string
  language: string
  alias: string
  visibility: PasteVisibility
  password_hash?: string | null
  burn_after_reading: boolean
  forked_from: string | null
  expires_at: string | null
  created_at: string
  views: number
}

export interface Profile {
  id: string
  username: string | null
  role: 'user' | 'admin'
  created_at: string
  banned: boolean
}

export interface PasteWithAuthor extends Omit<Paste, 'password_hash'> {
  author: Pick<Profile, 'username'> | null
  parent?: {
    alias: string
    title: string
  } | null
}

export interface AppSettings {
  allowRegistrations: boolean
  enableGithub: boolean
  enableGoogle: boolean
  setupCompleted: boolean
}
