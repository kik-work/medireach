/**
 * Fixed-window in-memory rate limit, per server process. Enough for a prototype that runs on one
 * server; a multi-instance deployment would need a shared store.
 */
const windows = new Map<string, { start: number; count: number }>();

export function allow(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const w = windows.get(key);
  if (!w || now - w.start >= windowMs) {
    if (windows.size > 5000) windows.clear();
    windows.set(key, { start: now, count: 1 });
    return true;
  }
  if (w.count >= limit) return false;
  w.count += 1;
  return true;
}

/** Best-effort client key: the signed-in user, else the forwarding IP header, else one shared bucket. */
export const clientKey = (req: Request, userId?: string) =>
  userId ? `u:${userId}` : `ip:${req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "anon"}`;
