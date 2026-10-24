/**
 * Limiteur de débit en mémoire, suffisant pour un déploiement mono-instance.
 * Pour plusieurs instances, remplacer le Map par Upstash Redis.
 */
type Entry = { count: number; resetAt: number };

const g = globalThis as typeof globalThis & { __tesfactureRateLimit?: Map<string, Entry> };
const store = (g.__tesfactureRateLimit ??= new Map<string, Entry>());

export function checkRateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000
): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  return { ok: true, remaining: limit - entry.count, retryAfter: 0 };
}

export function resetRateLimit(key: string) {
  store.delete(key);
}

/** Nettoyage périodique pour éviter la croissance infinie du Map. */
export function pruneRateLimits() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}
