import "server-only";

/**
 * Lightweight fixed-window rate limiter, keyed by client IP.
 *
 * Scope note: in-memory, per-process — correct and effective for a single
 * server instance. On a multi-instance/serverless/edge deployment, each
 * instance enforces its own limit independently (so the *effective* limit
 * scales with instance count). For a strict shared limit across instances,
 * swap this module's storage for Redis (e.g. INCR + EXPIRE) — callers of
 * `checkRateLimit` would not need to change.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodic cleanup so the map doesn't grow unbounded with one-off IPs.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  clientKey: string,
  { limit = 120, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(clientKey);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(clientKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

/** Best-effort client IP extraction behind common proxy/CDN setups. */
export function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
