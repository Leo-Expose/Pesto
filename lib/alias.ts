import { nanoid } from 'nanoid'

const ALIAS_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MAX_ALIAS_LENGTH = 50

const RESERVED_ALIASES = new Set([
  'new', 'p', 'raw', 'api', 'auth', 'login', 'logout',
  'my-pastes', 'settings', 'admin', 'health', 'cron',
])

export function generateAlias(): string {
  return nanoid(8).toLowerCase().replace(/[^a-z0-9]/g, 'x')
}

export function isReserved(alias: string): boolean {
  return RESERVED_ALIASES.has(alias.toLowerCase())
}

export function isValidAlias(alias: string): boolean {
  if (!alias || alias.length > MAX_ALIAS_LENGTH) return false
  if (!ALIAS_REGEX.test(alias)) return false
  if (isReserved(alias)) return false
  return true
}

