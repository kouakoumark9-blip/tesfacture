import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Test d'intégration : base PGlite isolée, création réelle de documents
 * (numérotation, tranches, TVA, remise, bon de livraison, quotas).
 */

const TEST_DIR = path.join(process.cwd(), ".data", "test-pg");

let userId = "";
let saveDocumentForUser: typeof import("@/lib/documents-service").saveDocumentForUser;
let dbApi: typeof import("@/db/client");
let schema: typeof import("@/db/schema");
let getDocumentForUser: typeof import("@/lib/documents").getDocumentForUser;

beforeAll(async () => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  process.env.DATABASE_URL = "";
  process.env.PGLITE_DIR = TEST_DIR;
  process.env.AUTH_SECRET = "test-secret";

  dbApi = await import("@/db/client");
  schema = await import("@/db/schema");
  const service = await import("@/lib/documents-service");
  saveDocumentForUser = service.saveDocumentForUser;
  const docs = await import("@/lib/documents");
  getDocumentForUser = docs.getDocumentForUser;

  const db = await dbApi.getDb();
  const inserted = await db
    .insert(schema.users)
    .values({
      phone: "+2250700000001",
      name: "Test Intégration",
      passwordHash: "x",
      plan: "pro",
      planExpiresAt: new Date(Date.now() + 86_400_000 * 30),
    })
    .returning({ id: schema.users.id });
  userId = inserted[0].id;
});

afterAll(async () => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

const baseInput = {
  type: "FAC" as const,
  client: { name: "Krea Ecom", phone: "0707080910", email: "contact@krea.ci", address: "Abidjan" },
  lines: [{ description: "Création de site web", quantity: 1, unitPrice: 60_000 }],
  discountPercent: 0,
  vatPercent: 0 as const,
  issueDate: "2026-10-24",
  dueDate: "2026-11-23",
  note: "",
  paymentMethods: ["Wave", "Espèces"],
  installmentCount: 4,
  deposit: 20_000,
};

describe("création de documents", () => {
  it("crée une facture de 60 000 en 4 tranches (20 000 / 13 300 / 13 300 / 13 400)", async () => {
    const result = await saveDocumentForUser(userId, baseInput);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.number).toBe("FAC-2026-001");

    const bundle = await getDocumentForUser(result.id, userId);
    expect(bundle?.doc.total).toBe("60000.00");
    expect(bundle?.client?.name).toBe("Krea Ecom");
    expect(bundle?.installments.map((i) => Number(i.amount))).toEqual([
      20_000, 13_300, 13_300, 13_400,
    ]);
    expect(bundle?.installments.map((i) => i.label)).toEqual([
      "Acompte",
      "Tranche 2",
      "Tranche 3",
      "Solde",
    ]);
    expect(bundle?.doc.status).toBe("draft");
  });

  it("applique remise 10 % et TVA 18 %", async () => {
    const result = await saveDocumentForUser(userId, {
      ...baseInput,
      discountPercent: 10,
      vatPercent: 18,
      installmentCount: 1,
      deposit: 0,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const bundle = await getDocumentForUser(result.id, userId);
    expect(Number(bundle?.doc.subtotal)).toBe(60_000);
    expect(Number(bundle?.doc.discountAmount)).toBe(6_000);
    expect(Number(bundle?.doc.vatAmount)).toBe(9_720);
    expect(Number(bundle?.doc.total)).toBe(63_720);
    expect(bundle?.installments).toHaveLength(1);
    expect(bundle?.installments[0].label).toBe("Paiement comptant");
    expect(Number(bundle?.installments[0].amount)).toBe(63_720);
  });

  it("incrémente la numérotation sans trou", async () => {
    const result = await saveDocumentForUser(userId, baseInput);
    expect(result.ok && result.number).toBe("FAC-2026-003");
  });

  it("crée un devis avec son propre compteur", async () => {
    const result = await saveDocumentForUser(userId, { ...baseInput, type: "DEV" });
    expect(result.ok && result.number).toBe("DEV-2026-001");
  });

  it("crée un bon de livraison sans prix ni tranche", async () => {
    const result = await saveDocumentForUser(userId, {
      ...baseInput,
      type: "BL",
      lines: [{ description: "Ramette A4", quantity: 5, unitPrice: 4_500 }],
      paymentMethods: [],
      deliveryAddress: "Zone 4, Abidjan",
      installmentCount: 1,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const bundle = await getDocumentForUser(result.id, userId);
    expect(Number(bundle?.doc.total)).toBe(0);
    expect(bundle?.installments).toHaveLength(0);
    expect(Number(bundle?.items[0].unitPrice)).toBe(0);
    expect(bundle?.doc.deliveryAddress).toBe("Zone 4, Abidjan");
  });

  it("refuse un total de tranches incohérent", async () => {
    const result = await saveDocumentForUser(userId, {
      ...baseInput,
      installments: [
        { position: 0, label: "Acompte", amount: 10_000, dueDate: "2026-11-01" },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("somme des tranches");
  });

  it("refuse un document sans ligne", async () => {
    const result = await saveDocumentForUser(userId, { ...baseInput, lines: [] });
    expect(result.ok).toBe(false);
  });

  it("modifie un document existant sans changer son numéro", async () => {
    const created = await saveDocumentForUser(userId, baseInput);
    if (!created.ok) throw new Error(created.error);

    const updated = await saveDocumentForUser(userId, {
      ...baseInput,
      id: created.id,
      lines: [{ description: "Prestation de service", quantity: 2, unitPrice: 35_000 }],
      installmentCount: 1,
      deposit: 0,
    });
    expect(updated.ok && updated.number).toBe(created.number);

    const bundle = await getDocumentForUser(created.id, userId);
    expect(Number(bundle?.doc.total)).toBe(70_000);
    expect(bundle?.items).toHaveLength(1);
  });

  it("bloque le 6e document du plan Gratuit", async () => {
    const db = await dbApi.getDb();
    await db
      .update(schema.users)
      .set({ plan: "free", planExpiresAt: null })
      .where(eq(schema.users.id, userId));

    // 5 documents déjà créés plus haut dans ce fichier → la limite est atteinte
    const result = await saveDocumentForUser(userId, baseInput);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("documents gratuits");
  });
});
