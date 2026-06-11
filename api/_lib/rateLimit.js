const buckets = new Map();

export function rateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  if (buckets.size > 5000) {
    for (const [storedKey, storedBucket] of buckets) {
      if (now >= storedBucket.resetAt) buckets.delete(storedKey);
    }
  }

  return bucket.count <= maxRequests;
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}
