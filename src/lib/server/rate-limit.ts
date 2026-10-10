/**
 * Simple in-memory rate limiter.
 * Tracks request counts per key within a sliding window.
 *
 * Not suitable for multi-process deployments — for that, use Redis or similar.
 * Perfectly fine for a single-node SvelteKit adapter-node deployment.
 */

interface WindowEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, WindowEntry>();

// Periodically clean up expired entries to prevent memory leaks
void setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key);
  }
}, 60_000);

export interface RateLimitConfig {
  /** Maximum requests allowed within the window */
  max: number;
  /** Window duration in seconds */
  windowSec: number;
  /** Key to identify the client (e.g. IP, user ID) */
  key: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // unix timestamp in ms
}

export function check(config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const existing = store.get(config.key);

  if (!existing || now >= existing.resetAt) {
    // New window
    const resetAt = now + config.windowSec * 1000;
    store.set(config.key, { count: 1, resetAt });
    return { allowed: true, remaining: config.max - 1, resetAt };
  }

  if (existing.count >= config.max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: config.max - existing.count,
    resetAt: existing.resetAt,
  };
}
