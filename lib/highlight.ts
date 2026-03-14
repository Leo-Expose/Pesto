import { createHighlighter, bundledLanguages, type Highlighter, type BundledTheme, type BundledLanguage } from 'shiki'

let highlighter: Highlighter | null = null
const loadedThemes = new Set<string>()

const INITIAL_THEMES: BundledTheme[] = ['github-light', 'github-dark']

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: INITIAL_THEMES,
      langs: [],
    })
    INITIAL_THEMES.forEach((theme) => loadedThemes.add(theme))
  }
  return highlighter
}

async function ensureTheme(h: Highlighter, themeId: string): Promise<void> {
  if (!loadedThemes.has(themeId)) {
    await h.loadTheme(themeId as BundledTheme)
    loadedThemes.add(themeId)
  }
}

export async function highlight(code: string, lang: string, themeName?: string): Promise<string> {
  try {
    const h = await getHighlighter()
    const safeLang: BundledLanguage | 'text' = lang in bundledLanguages ? (lang as BundledLanguage) : 'text'

    if (safeLang !== 'text') {
      const loadedLangs = h.getLoadedLanguages()
      if (!loadedLangs.includes(safeLang)) {
        await h.loadLanguage(safeLang)
      }
    }

    if (themeName) {
      await ensureTheme(h, themeName)
      return h.codeToHtml(code, {
        lang: safeLang,
        theme: themeName,
      })
    }

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

    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    return `<pre><code>${escaped}</code></pre>`
  }
}
