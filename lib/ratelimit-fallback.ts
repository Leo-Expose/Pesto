interface RateLimitEntry {
  count: number
  start: number
}

const counts = new Map<string, RateLimitEntry>()

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = counts.get(key) || { count: 0, start: now }

  if (now - entry.start > windowMs) {
    entry.count = 0
    entry.start = now
  }

  entry.count++
  counts.set(key, entry)
  return entry.count <= max
}
