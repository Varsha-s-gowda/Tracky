const ApiError = require('../utils/ApiError');

/**
 * Small in-memory fixed-window rate limiter.
 *
 * Render may run more than one instance, so this is a best-effort guard rather
 * than a distributed quota. It still protects a single process from accidental
 * abuse and brute-force attempts, and it uses no external dependency.
 */
function createRateLimiter({ windowMs = 60 * 1000, max = 100, keyPrefix = 'global' } = {}) {
  const buckets = new Map();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, Math.max(windowMs, 30 * 1000));
  if (typeof cleanup.unref === 'function') cleanup.unref();

  return function rateLimiter(req, res, next) {
    const identity = req.user?._id ? String(req.user._id) : req.ip || 'unknown';
    const key = `${keyPrefix}:${identity}`;
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, max - bucket.count);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return next(
        new ApiError(429, 'Too many requests. Please wait a moment and try again.', {
          retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
        })
      );
    }

    return next();
  };
}

module.exports = { createRateLimiter };
