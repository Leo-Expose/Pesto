import type { Extension } from '@codemirror/state'

/**
 * Lazy-loaded CodeMirror language extensions.
 * Each function returns a Promise that resolves to CodeMirror Extension(s).
 * Only the selected language is loaded to minimize bundle size.
 */
const LANG_MAP: Record<string, () => Promise<Extension>> = {
  javascript: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ jsx: true })),
  typescript: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ jsx: true, typescript: true })),
  jsx: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ jsx: true })),
  tsx: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ jsx: true, typescript: true })),
  python: () => import('@codemirror/lang-python').then((m) => m.python()),
  html: () => import('@codemirror/lang-html').then((m) => m.html()),
  css: () => import('@codemirror/lang-css').then((m) => m.css()),
  json: () => import('@codemirror/lang-json').then((m) => m.json()),
  markdown: () => import('@codemirror/lang-markdown').then((m) => m.markdown()),
  sql: () => import('@codemirror/lang-sql').then((m) => m.sql()),
  rust: () => import('@codemirror/lang-rust').then((m) => m.rust()),
  cpp: () => import('@codemirror/lang-cpp').then((m) => m.cpp()),
  c: () => import('@codemirror/lang-cpp').then((m) => m.cpp()),
  java: () => import('@codemirror/lang-java').then((m) => m.java()),
  php: () => import('@codemirror/lang-php').then((m) => m.php()),
  xml: () => import('@codemirror/lang-xml').then((m) => m.xml()),
  yaml: () => import('@codemirror/lang-yaml').then((m) => m.yaml()),
  go: () => import('@codemirror/lang-go').then((m) => m.go()),
}

/**
 * Load a CodeMirror language extension by language ID.
 * Returns null if the language is not supported (will use plain text).
 */
export async function loadLanguageExtension(lang: string): Promise<Extension | null> {
  const loader = LANG_MAP[lang]
  if (!loader) return null

  try {
    return await loader()
  } catch {
    console.warn(`Failed to load CodeMirror language: ${lang}`)
    return null
  }
}

/** List of languages that have CodeMirror support */
export const SUPPORTED_CM_LANGUAGES = Object.keys(LANG_MAP)
