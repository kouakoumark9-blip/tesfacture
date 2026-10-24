import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { documents, users } from "@/db/schema";
import { todayISO } from "./format";
import { PLANS, isPaidPlan, type PlanId } from "./plans";

export * from "./plans";

/** Plan réellement actif : un plan payant expiré retombe en gratuit. */
export async function effectivePlan(userId: string): Promise<PlanId> {
  const db = await getDb();
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = rows[0];
  if (!user) return "free";

  if (!isPaidPlan(user.plan)) return "free";
  if (!user.planExpiresAt) return "free";
  const expired = user.planExpiresAt.getTime() < Date.now();
  return expired ? "free" : (user.plan as PlanId);
}

/** Nombre de documents créés depuis le début du mois. */
export async function documentsThisMonth(userId: string): Promise<number> {
  const db = await getDb();
  const start = new Date();
  const firstDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1, 0, 0, 0));

  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(documents)
    .where(and(eq(documents.userId, userId), gte(documents.createdAt, firstDay)));

  return Number(rows[0]?.count ?? 0);
}

export type QuotaResult =
  | { ok: true; remaining: number | null }
  | { ok: false; error: string; code: "LIMIT" };

/** Blocage serveur quand la limite du plan Gratuit est atteinte. */
export async function assertCanCreateDocument(userId: string): Promise<QuotaResult> {
  const plan = await effectivePlan(userId);
  const definition = PLANS[plan];
  if (definition.documentsPerMonth === null) return { ok: true, remaining: null };

  const used = await documentsThisMonth(userId);
  if (used >= definition.documentsPerMonth) {
    return {
      ok: false,
      code: "LIMIT",
      error: `Vous avez utilisé vos ${definition.documentsPerMonth} documents gratuits du mois. Passez au plan Pro pour continuer à facturer sans limite.`,
    };
  }
  return { ok: true, remaining: definition.documentsPerMonth - used };
}

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

/** Ajoute 30 jours à l'abonnement (ou part de maintenant si expiré). */
export function extendedExpiry(current: Date | null): Date {
  const now = new Date();
  if (current && current > now) return new Date(current.getTime() + 30 * 86_400_000);
  return new Date(now.getTime() + 30 * 86_400_000);
}

/** Date d'aujourd'hui, exposée pour les vérifications d'expiration côté UI. */
export function todayForPlan() {
  return todayISO();
}
