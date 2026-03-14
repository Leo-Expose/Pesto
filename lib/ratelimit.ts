import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { checkRateLimit } from './ratelimit-fallback'

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  if (!redis) {
    redis = Redis.fromEnv()
  }
  return redis
}

function createLimiter(
  max: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1],
  prefix: string
): Ratelimit | null {
  const r = getRedis()
  if (!r) return null
  return new Ratelimit({ redis: r, limiter: Ratelimit.slidingWindow(max, window), prefix })
}

const limiters = {
  pasteCreate: () => createLimiter(10, '1 m', 'rl:create'),
}

export async function withRateLimit(
  type: keyof typeof limiters,
  identifier: string,
  handler: () => Promise<Response>
): Promise<Response> {
  const limiter = limiters[type]()

  if (limiter) {
    const { success, remaining, reset } = await limiter.limit(identifier)
    if (!success) {
      return Response.json(
        { error: 'Rate limit exceeded', reset: new Date(reset).toISOString() },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': String(remaining),
            'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
          },
        }
      )
    }
  } else {
    const windowMs = 60_000
    const max = 10
    if (!checkRateLimit(`${type}:${identifier}`, max, windowMs)) {
      return Response.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
  }

  return handler()
}
