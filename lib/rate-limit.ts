type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

let lastPruned = Date.now();
function pruneExpired() {
  const now = Date.now();
  if (now - lastPruned < 60000) return;
  lastPruned = now;
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function allowRequest(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  pruneExpired();
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}
