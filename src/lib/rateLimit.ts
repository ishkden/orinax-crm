const ipBuckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimitByIp(
  ip: string,
  maxAttempts = 10,
  windowMs = 60_000,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  let bucket = ipBuckets.get(ip);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    ipBuckets.set(ip, bucket);
  }

  bucket.count++;

  if (bucket.count > maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: maxAttempts - bucket.count };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of ipBuckets) {
    if (now >= bucket.resetAt) ipBuckets.delete(key);
  }
}, 60_000);
