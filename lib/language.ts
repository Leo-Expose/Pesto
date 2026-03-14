import hljs from 'highlight.js'

/**
 * Detect if content is likely Markdown based on heuristic scoring.
 * Returns true if the markdown score meets the threshold.
 */
export function isLikelyMarkdown(content: string): boolean {
  const score =
    (content.match(/^#+ /gm) ? 2 : 0) +
    (content.match(/\[([^\]]+)\]\(([^)]+)\)/g) ? 2 : 0) +
    (content.match(/(\*\*|__)(.*?)\1/g) ? 1 : 0) +
    (content.match(/^\s*[-*+]\s+/gm) ? 1 : 0) +
    (content.match(/```[a-z]*\n[\s\S]*?\n```/g) ? 2 : 0)

  return score >= 3
}

/**
 * Auto-detect the language of a code snippet.
 * Checks for markdown first, then falls back to highlight.js detection.
 */
export function detectLanguage(content: string): string {
  if (isLikelyMarkdown(content)) return 'markdown'

  const detect = hljs.highlightAuto(content)
  return detect.language || 'text'
}
