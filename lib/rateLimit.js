// In-memory rate limiter — adequate for single-instance deployments
// For multi-instance production, swap the store for Redis.

const store = new Map()

// Clean up expired entries periodically to avoid memory growth
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 60_000)

/**
 * Returns { allowed, remaining, retryAfterMs }
 * @param {string} key   – e.g. IP address
 * @param {number} max   – max attempts per window (default 5)
 * @param {number} windowMs – window length in ms (default 10 min)
 */
export function rateLimit(key, max = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1, retryAfterMs: 0 }
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true, remaining: max - entry.count, retryAfterMs: 0 }
}

export function resetRateLimit(key) {
  store.delete(key)
}
