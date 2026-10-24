"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { paymentRequests, users } from "@/db/schema";
import { requireAdmin, requireUser } from "@/lib/session";
import { logAdminAction } from "@/lib/admin";
import { PLANS, isPaidPlan, type PlanId } from "@/lib/plan";
import { createSubscriptionInvoice } from "@/lib/subscription-invoice";
import { revalidatePath } from "next/cache";

import { extendedExpiry, type ActionResult } from "./plan";

export async function validatePaymentRequest(requestId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const db = await getDb();

  const rows = await db
    .select()
    .from(paymentRequests)
    .where(eq(paymentRequests.id, requestId))
    .limit(1);
  const request = rows[0];
  if (!request) return { ok: false, error: "Demande introuvable." };
  if (request.status !== "pending") return { ok: false, error: "Cette demande est déjà traitée." };

  const userRows = await db.select().from(users).where(eq(users.id, request.userId)).limit(1);
  const target = userRows[0];
  if (!target) return { ok: false, error: "Utilisateur introuvable." };

  const expiry = extendedExpiry(target.planExpiresAt ?? null);

  await db
    .update(users)
    .set({ plan: request.plan, planExpiresAt: expiry, role: target.role })
    .where(eq(users.id, target.id));

  await db
    .update(paymentRequests)
    .set({ status: "validated", validatedAt: new Date() })
    .where(eq(paymentRequests.id, requestId));

  await logAdminAction({
    adminId: admin.id,
    action: "payment_request.validated",
    targetUserId: target.id,
    targetId: requestId,
    details: `Plan ${request.plan} activé jusqu'au ${expiry.toISOString().slice(0, 10)} (réf. ${request.reference})`,
  });

  // Facture d'abonnement générée dans le compte de l'administrateur
  await createSubscriptionInvoice({
    adminId: admin.id,
    subscriberName: target.name,
    subscriberPhone: target.phone,
    plan: request.plan as PlanId,
    reference: request.reference,
  });

  revalidatePath("/admin");
  revalidatePath("/app/abonnement");
  return { ok: true, message: `Plan ${PLANS[request.plan as PlanId]?.label ?? request.plan} activé.` };
}

export async function rejectPaymentRequest(requestId: string, reason?: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const db = await getDb();

  const rows = await db
    .select()
    .from(paymentRequests)
    .where(eq(paymentRequests.id, requestId))
    .limit(1);
  const request = rows[0];
  if (!request) return { ok: false, error: "Demande introuvable." };

  await db
    .update(paymentRequests)
    .set({ status: "rejected", validatedAt: new Date() })
    .where(eq(paymentRequests.id, requestId));

  await logAdminAction({
    adminId: admin.id,
    action: "payment_request.rejected",
    targetUserId: request.userId,
    targetId: requestId,
    details: reason || `Référence ${request.reference}`,
  });

  revalidatePath("/admin");
  revalidatePath("/app/abonnement");
  return { ok: true, message: "Demande rejetée." };
}

/** L'utilisateur envoie sa référence de paiement Wave. */
export async function submitPaymentRequest(input: {
  plan: string;
  reference: string;
}): Promise<ActionResult> {
  const user = await requireUser();
  const plan = input.plan as PlanId;

  if (plan !== "pro" && plan !== "business") {
    return { ok: false, error: "Choisissez le plan Pro ou Business." };
  }
  const reference = input.reference.trim();
  if (reference.length < 3) {
    return { ok: false, error: "Saisissez la référence ou le numéro qui a payé." };
  }

  const db = await getDb();
  await db.insert(paymentRequests).values({
    userId: user.id,
    plan,
    amount: String(PLANS[plan].price),
    reference,
  });

  revalidatePath("/app/abonnement");
  return { ok: true, message: "Demande envoyée. Le paiement est en cours de vérification." };
}

/** Changement de plan par l'administrateur. */
export async function adminChangePlan(userId: string, plan: PlanId | "free"): Promise<ActionResult> {
  const admin = await requireAdmin();
  const db = await getDb();

  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const target = rows[0];
  if (!target) return { ok: false, error: "Utilisateur introuvable." };

  await db
    .update(users)
    .set({
      plan,
      planExpiresAt: isPaidPlan(plan) ? extendedExpiry(target.planExpiresAt ?? null) : null,
    })
    .where(eq(users.id, userId));

  await logAdminAction({
    adminId: admin.id,
    action: "user.plan_changed",
    targetUserId: userId,
    details: `${target.plan} → ${plan}`,
  });

  revalidatePath("/admin");
  return { ok: true, message: "Plan mis à jour." };
}

export async function adminSuspendUser(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (userId === admin.id) return { ok: false, error: "Vous ne pouvez pas vous suspendre." };

  const db = await getDb();
  await db
    .update(users)
    .set({ suspendedAt: new Date(), plan: "free", planExpiresAt: null })
    .where(eq(users.id, userId));

  await logAdminAction({
    adminId: admin.id,
    action: "user.suspended",
    targetUserId: userId,
  });

  revalidatePath("/admin");
  return { ok: true, message: "Compte suspendu." };
}

export async function adminReactivateUser(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const db = await getDb();
  await db.update(users).set({ suspendedAt: null }).where(eq(users.id, userId));

  await logAdminAction({
    adminId: admin.id,
    action: "user.reactivated",
    targetUserId: userId,
  });

  revalidatePath("/admin");
  return { ok: true, message: "Compte réactivé." };
}

/** Réinitialisation du mot de passe : renvoie un mot de passe temporaire. */
export async function adminResetPassword(userId: string): Promise<ActionResult & { password?: string }> {
  const admin = await requireAdmin();
  const db = await getDb();

  const temp = `FCI-${Math.random().toString(36).slice(2, 8)}`;
  const { hashPassword } = await import("@/lib/auth-users");

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(temp) })
    .where(eq(users.id, userId));

  await logAdminAction({
    adminId: admin.id,
    action: "user.password_reset",
    targetUserId: userId,
  });

  revalidatePath("/admin");
  return {
    ok: true,
    message: "Mot de passe réinitialisé. Communiquez-le au client.",
    password: temp,
  };
}
