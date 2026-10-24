import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Test d'intégration du parcours d'abonnement :
 * demande de paiement Wave → validation administrateur → plan prolongé
 * + facture d'abonnement générée dans le compte administrateur.
 */

const TEST_DIR = path.join(process.cwd(), ".data", "test-pg-sub");

let currentUserId = "";
let adminId = "";

vi.mock("@/lib/session", () => ({
  requireUser: async () => {
    const { getDb } = await import("@/db/client");
    const { users } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const rows = await db.select().from(users).where(eq(users.id, currentUserId)).limit(1);
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      role: row.role,
      plan: row.plan,
      phone: row.phone,
      email: row.email,
    };
  },
  requireAdmin: async () => ({ id: adminId, name: "Admin", role: "admin" }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: () => {},
  revalidateTag: () => {},
  unstable_cache: (fn: unknown) => fn,
}));

let subscription: typeof import("@/lib/subscription");
let plan: typeof import("@/lib/plan");
let schema: typeof import("@/db/schema");
let dbApi: typeof import("@/db/client");
let eq: typeof import("drizzle-orm").eq;

beforeAll(async () => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  process.env.DATABASE_URL = "";
  process.env.PGLITE_DIR = TEST_DIR;
  process.env.AUTH_SECRET = "test-secret";

  dbApi = await import("@/db/client");
  schema = await import("@/db/schema");
  eq = (await import("drizzle-orm")).eq;
  subscription = await import("@/lib/subscription");
  plan = await import("@/lib/plan");

  const db = await dbApi.getDb();
  const inserted = await db
    .insert(schema.users)
    .values([
      { phone: "+2250700000002", name: "Boutique Test", passwordHash: "x", plan: "free" },
      {
        phone: "+2250700000003",
        name: "Administrateur Test",
        passwordHash: "x",
        plan: "business",
        role: "admin",
      },
    ])
    .returning({ id: schema.users.id });
  currentUserId = inserted[0].id;
  adminId = inserted[1].id;
});

afterAll(async () => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe("abonnement", () => {
  it("démarre en plan Gratuit", async () => {
    expect(await plan.effectivePlan(currentUserId)).toBe("free");
  });

  it("crée une demande de paiement en attente", async () => {
    const result = await subscription.submitPaymentRequest({
      plan: "pro",
      reference: "WAVE-TEST-001",
    });
    expect(result.ok).toBe(true);

    const db = await dbApi.getDb();
    const rows = await db
      .select()
      .from(schema.paymentRequests)
      .where(eq(schema.paymentRequests.userId, currentUserId));
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("pending");
    expect(Number(rows[0].amount)).toBe(4_900);
  });

  it("valide la demande : plan Pro pendant 30 jours + facture d'abonnement", async () => {
    const db = await dbApi.getDb();
    const pending = await db
      .select()
      .from(schema.paymentRequests)
      .where(eq(schema.paymentRequests.status, "pending"));
    expect(pending).toHaveLength(1);

    const result = await subscription.validatePaymentRequest(pending[0].id);
    expect(result.ok).toBe(true);

    expect(await plan.effectivePlan(currentUserId)).toBe("pro");

    const userRows = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, currentUserId));
    const expiry = userRows[0].planExpiresAt;
    expect(expiry).not.toBeNull();
    const days = Math.round(((expiry as Date).getTime() - Date.now()) / 86_400_000);
    expect(days).toBeGreaterThanOrEqual(29);
    expect(days).toBeLessThanOrEqual(31);

    const invoices = await db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.userId, adminId));
    expect(invoices).toHaveLength(1);
    expect(Number(invoices[0].total)).toBe(4_900);
    expect(invoices[0].status).toBe("paid");

    const log = await db.select().from(schema.adminActions);
    expect(log.some((row) => row.action === "payment_request.validated")).toBe(true);
  });

  it("refuse de valider deux fois la même demande", async () => {
    const db = await dbApi.getDb();
    const rows = await db.select().from(schema.paymentRequests);
    const result = await subscription.validatePaymentRequest(rows[0].id);
    expect(result.ok).toBe(false);
  });

  it("réactive et suspend un compte", async () => {
    expect((await subscription.adminSuspendUser(currentUserId)).ok).toBe(true);
    const db = await dbApi.getDb();
    let rows = await db.select().from(schema.users).where(eq(schema.users.id, currentUserId));
    expect(rows[0].suspendedAt).not.toBeNull();

    expect((await subscription.adminReactivateUser(currentUserId)).ok).toBe(true);
    rows = await db.select().from(schema.users).where(eq(schema.users.id, currentUserId));
    expect(rows[0].suspendedAt).toBeNull();
  });

  it("rétrograde en Gratuit après expiration", async () => {
    const db = await dbApi.getDb();
    await db
      .update(schema.users)
      .set({ planExpiresAt: new Date(Date.now() - 86_400_000) })
      .where(eq(schema.users.id, currentUserId));
    expect(await plan.effectivePlan(currentUserId)).toBe("free");
  });
});
