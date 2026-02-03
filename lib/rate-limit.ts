// Simple in-memory rate limiter
// For production, consider using Redis or Upstash

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export function rateLimit(identifier: string, config: RateLimitConfig): {
  success: boolean
  limit: number
  remaining: number
  reset: number
} {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || now > entry.resetAt) {
    // Create new entry
    const resetAt = now + config.windowMs
    rateLimitStore.set(identifier, { count: 1, resetAt })

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: resetAt
    }
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: entry.resetAt
    }
  }

  // Increment count
  entry.count++

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    reset: entry.resetAt
  }
}

export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown'

  return ip
}
