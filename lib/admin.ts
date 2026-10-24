import { and, desc, eq, gte, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  adminActions,
  documents,
  paymentRequests,
  users,
  type User,
} from "@/db/schema";
import { PLANS, isPaidPlan, type PlanId } from "./plan";

export type AdminOverview = {
  usersTotal: number;
  newThisWeek: number;
  activeLast30Days: number;
  byPlan: Record<PlanId, number>;
  mrr: number;
  conversionRate: number | null;
  pendingRequests: number;
};

export async function adminOverview(): Promise<AdminOverview> {
  const db = await getDb();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const monthAgo = new Date(now.getTime() - 30 * 86_400_000);

  const allUsers = await db.select().from(users);

  const newThisWeek = allUsers.filter((u) => u.createdAt >= weekAgo).length;

  const activeRows = await db
    .select({ userId: documents.userId })
    .from(documents)
    .where(gte(documents.createdAt, monthAgo))
    .groupBy(documents.userId);
  const activeLast30Days = activeRows.length;

  const byPlan: Record<PlanId, number> = { free: 0, pro: 0, business: 0 };
  let mrr = 0;
  for (const user of allUsers) {
    const plan = isPaidPlan(user.plan) && user.planExpiresAt && user.planExpiresAt > now
      ? (user.plan as PlanId)
      : "free";
    byPlan[plan] += 1;
    if (plan !== "free") mrr += PLANS[plan].price;
  }

  const payers = allUsers.filter((u) => isPaidPlan(u.plan)).length;
  const conversionRate =
    allUsers.length > 0 ? Math.round((payers / allUsers.length) * 100) : null;

  const pending = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(paymentRequests)
    .where(eq(paymentRequests.status, "pending"));

  return {
    usersTotal: allUsers.length,
    newThisWeek,
    activeLast30Days,
    byPlan,
    mrr,
    conversionRate,
    pendingRequests: Number(pending[0]?.count ?? 0),
  };
}

export type UserRow = {
  user: User;
  documentsCount: number;
  effectivePlanId: PlanId;
};

export async function listUsers(query?: string): Promise<UserRow[]> {
  const db = await getDb();
  const rows = await db.select().from(users).orderBy(desc(users.createdAt));

  const counts = await db
    .select({ userId: documents.userId, count: sql<number>`count(*)::int` })
    .from(documents)
    .groupBy(documents.userId);
  const countByUser = new Map(counts.map((c) => [c.userId, Number(c.count)]));

  const q = (query ?? "").trim().toLowerCase();
  const filtered = q
    ? rows.filter(
        (u) => u.name.toLowerCase().includes(q) || u.phone.toLowerCase().includes(q)
      )
    : rows;

  return filtered.map((user) => ({
    user,
    documentsCount: countByUser.get(user.id) ?? 0,
    effectivePlanId:
      isPaidPlan(user.plan) && user.planExpiresAt && user.planExpiresAt > new Date()
        ? (user.plan as PlanId)
        : "free",
  }));
}

export type RequestRow = {
  request: typeof paymentRequests.$inferSelect;
  userName: string;
  userPhone: string;
};

export async function listPaymentRequests(status = "pending"): Promise<RequestRow[]> {
  const db = await getDb();
  const rows = await db
    .select({
      request: paymentRequests,
      userName: users.name,
      userPhone: users.phone,
    })
    .from(paymentRequests)
    .innerJoin(users, eq(users.id, paymentRequests.userId))
    .where(eq(paymentRequests.status, status))
    .orderBy(desc(paymentRequests.createdAt));

  return rows;
}

export async function listAdminLog(limit = 30) {
  const db = await getDb();
  return db
    .select({
      action: adminActions,
      adminName: users.name,
    })
    .from(adminActions)
    .leftJoin(users, eq(users.id, adminActions.adminId))
    .orderBy(desc(adminActions.createdAt))
    .limit(limit);
}

export async function logAdminAction(input: {
  adminId: string;
  action: string;
  targetUserId?: string | null;
  targetId?: string | null;
  details?: string;
}) {
  const db = await getDb();
  await db.insert(adminActions).values({
    adminId: input.adminId,
    action: input.action,
    targetUserId: input.targetUserId ?? null,
    targetId: input.targetId ?? null,
    details: input.details ?? null,
  });
}

/** Utilisateurs actifs : au moins un document créé sur les 30 derniers jours. */
export async function activeUsersCount(days = 30): Promise<number> {
  const db = await getDb();
  const since = new Date(Date.now() - days * 86_400_000);
  const rows = await db
    .select({ userId: documents.userId })
    .from(documents)
    .where(gte(documents.createdAt, since))
    .groupBy(documents.userId);
  return rows.length;
}

/** Comptes non suspendus (filtre utilitaire). */
export function notSuspended() {
  return or(isNull(users.suspendedAt), eq(users.suspendedAt, users.suspendedAt));
}

export async function countDocuments(userId: string) {
  const db = await getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(documents)
    .where(and(eq(documents.userId, userId)));
  return Number(rows[0]?.count ?? 0);
}
