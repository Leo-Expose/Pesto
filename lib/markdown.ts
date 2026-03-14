import markdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'

const md = markdownIt({ html: true, linkify: true, typographer: true })

export function renderMarkdown(content: string): string {
  const raw = md.render(content)
  return sanitizeHtml(raw, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'code', 'pre', 'ul', 'ol', 'li',
      'strong', 'em', 'a', 'blockquote', 'table', 'thead', 'tbody',
      'tr', 'th', 'td', 'img', 'hr', 'del', 'sup', 'sub', 'span',
    ],
    allowedAttributes: {
      '*': ['class', 'title'],
      'a': ['href', 'name', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  })
}
