import { createHighlighter, bundledLanguages, type Highlighter, type BundledTheme } from 'shiki'

let highlighter: Highlighter | null = null
const loadedThemes = new Set<string>()

// Start with a minimal set so the initial load is fast
const INITIAL_THEMES: BundledTheme[] = ['github-light', 'github-dark']

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: INITIAL_THEMES,
      langs: [],
    })
    INITIAL_THEMES.forEach((t) => loadedThemes.add(t))
  }
  return highlighter
}

/**
 * Ensure a theme is loaded into the highlighter (lazy-load on demand).
 */
async function ensureTheme(h: Highlighter, themeId: string): Promise<void> {
  if (!loadedThemes.has(themeId)) {
    await h.loadTheme(themeId as BundledTheme)
    loadedThemes.add(themeId)
  }
}

/**
 * Highlight code with a specific theme, or dual light/dark themes.
 * Themes are lazy-loaded on first use to keep startup fast.
 */
export async function highlight(code: string, lang: string, themeName?: string): Promise<string> {
  try {
    const h = await getHighlighter()

    const isSupported = lang in bundledLanguages
    const safeLang = isSupported ? lang : 'text'

    if (safeLang !== 'text') {
      const loadedLangs = h.getLoadedLanguages()
      if (!loadedLangs.includes(safeLang as any)) {
        await h.loadLanguage(safeLang as any)
      }
    }

    if (themeName) {
      await ensureTheme(h, themeName)
      return h.codeToHtml(code, {
        lang: safeLang,
        theme: themeName,
      })
    }

    // Dual theme mode: light + dark with CSS variables
    await ensureTheme(h, 'github-light')
    await ensureTheme(h, 'github-dark')

    return h.codeToHtml(code, {
      lang: safeLang,
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    })
  } catch (error) {
    console.error('Shiki highlighting failed:', error)

    // Fallback: return escaped plain text
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return `<pre><code>${escaped}</code></pre>`
  }
}
