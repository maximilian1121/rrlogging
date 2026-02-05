const requestLog = new Map<string, number[]>();

export function rateLimit(ip: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const timestamps = requestLog.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    return { allowed: false, retryAfter: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }

  recent.push(now);
  requestLog.set(ip, recent);
  return { allowed: true };
}