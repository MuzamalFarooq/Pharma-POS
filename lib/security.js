import crypto from 'crypto';

// Rate limiter state: map of `${key}` -> Array of timestamps
const rateLimitMap = new Map();

// Automatic cleanup every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of rateLimitMap.entries()) {
      const valid = timestamps.filter((t) => now - t < 15 * 60 * 1000);
      if (valid.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, valid);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Check rate limit for a specific identifier within a window.
 * @param {string} key Identifier (e.g. `forgot:ip:127.0.0.1` or `forgot:email:user@domain.com`)
 * @param {number} maxAttempts Maximum allowed attempts
 * @param {number} windowMs Time window in milliseconds
 * @returns {{ allowed: boolean, remaining: number, retryAfterSeconds: number }}
 */
export function checkRateLimit(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const existing = rateLimitMap.get(key) || [];
  const validTimestamps = existing.filter((time) => now - time < windowMs);

  if (validTimestamps.length >= maxAttempts) {
    const oldestTimestamp = validTimestamps[0];
    const retryAfterSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(retryAfterSeconds, 1),
    };
  }

  validTimestamps.push(now);
  rateLimitMap.set(key, validTimestamps);

  return {
    allowed: true,
    remaining: maxAttempts - validTimestamps.length,
    retryAfterSeconds: 0,
  };
}

/**
 * Extracts client IP safely from request headers
 */
export function getClientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Generates a cryptographically secure random reset token
 */
export function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Computes SHA-256 hash of a reset token for database storage/comparison
 */
export function hashResetToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return '';
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}
