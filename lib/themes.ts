import { bundledThemes } from 'shiki'

export interface ThemeInfo {
  id: string
  name: string
  type: 'bundled'
}

/** Human-readable name from a theme ID like "github-dark" => "GitHub Dark" */
function humanize(id: string): string {
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

let cachedThemes: ThemeInfo[] | null = null

/**
 * Returns the full list of available syntax highlighting themes.
 * Uses Shiki's bundled themes (~90+ themes).
 */
export function listThemes(): ThemeInfo[] {
  if (cachedThemes) return cachedThemes

  cachedThemes = Object.keys(bundledThemes)
    .sort()
    .map((id) => ({
      id,
      name: humanize(id),
      type: 'bundled' as const,
    }))

  return cachedThemes
}

/**
 * Checks if a theme ID is valid (exists in bundled themes).
 */
export function isValidTheme(themeId: string): boolean {
  return themeId in bundledThemes
}
