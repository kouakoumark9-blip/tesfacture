import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { clients, companies, documentItems, documents, installments } from "@/db/schema";
import { addDaysISO } from "@/lib/format";
import { buildInstallments, computeTotals, installmentsValid } from "@/lib/calc";
import { documentInputSchema, type DocumentInput } from "@/lib/validation";
import {
  getDocumentForUser,
  newShareToken,
  nextNumber,
  refreshStatus,
  type DocType,
} from "@/lib/documents";
import { assertCanCreateDocument } from "@/lib/plan";

export type SaveResult =
  | { ok: true; id: string; number: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Crée ou met à jour un client à partir de la saisie de l'étape 1. */
async function upsertClient(userId: string, input: DocumentInput["client"]): Promise<string> {
  const db = await getDb();

  if (input.id) {
    const rows = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, input.id), eq(clients.userId, userId)))
      .limit(1);
    if (rows[0]) {
      await db
        .update(clients)
        .set({
          name: input.name,
          phone: input.phone || null,
          email: input.email || null,
          address: input.address || null,
        })
        .where(eq(clients.id, input.id));
      return input.id;
    }
  }

  const existing = await db
    .select()
    .from(clients)
    .where(and(eq(clients.userId, userId), eq(clients.name, input.name)))
    .limit(1);

  if (existing[0]) {
    await db
      .update(clients)
      .set({
        phone: input.phone || existing[0].phone,
        email: input.email || existing[0].email,
        address: input.address || existing[0].address,
      })
      .where(eq(clients.id, existing[0].id));
    return existing[0].id;
  }

  const inserted = await db
    .insert(clients)
    .values({
      userId,
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
    })
    .returning({ id: clients.id });

  return inserted[0].id;
}

/** Mémorise les numéros Mobile Money saisis à l'étape 3 dans le profil. */
async function savePaymentNumbers(userId: string, input: DocumentInput["paymentNumbers"]) {
  if (!input) return;
  const db = await getDb();
  const existing = await db.select().from(companies).where(eq(companies.userId, userId)).limit(1);
  if (!existing[0]) return;

  const current = (existing[0].paymentNumbers ?? {}) as Record<string, string | undefined>;
  const merged = { ...current };
  for (const key of ["wave", "orange", "mtn", "moov"] as const) {
    const value = input[key]?.trim();
    if (value) merged[key] = value;
  }
  await db.update(companies).set({ paymentNumbers: merged }).where(eq(companies.userId, userId));
}

export async function saveDocumentForUser(
  userId: string,
  input: DocumentInput
): Promise<SaveResult> {

  const parsed = documentInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Vérifiez les informations saisies.", fieldErrors };
  }
  const data = parsed.data;

  const isBL = data.type === "BL";
  const totals = isBL
    ? { subtotal: 0, discountAmount: 0, vatAmount: 0, total: 0 }
    : computeTotals({
        lines: data.lines,
        discountPercent: data.discountPercent,
        vatPercent: data.vatPercent,
      });

  // Contrôle de cohérence des tranches : la somme doit égaler le total.
  const plan =
    data.installments && data.installments.length > 0
      ? data.installments.map((item, index) => ({
          position: index,
          label: item.label,
          amount: Math.round(item.amount),
          dueDate: item.dueDate || data.dueDate || null,
        }))
      : buildInstallments(totals.total, data.installmentCount, data.deposit).map((item) => ({
          ...item,
          dueDate: data.dueDate || addDaysISO(data.issueDate, 30),
        }));

  if (!isBL && !installmentsValid(plan.map((p) => ({ amount: p.amount })), totals.total)) {
    return {
      ok: false,
      error: "La somme des tranches doit être égale au total du document.",
    };
  }

  const db = await getDb();
  const clientId = await upsertClient(userId, data.client);
  await savePaymentNumbers(userId, data.paymentNumbers);

  const existing = data.id
    ? await getDocumentForUser(data.id, userId)
    : null;

  let documentId = data.id ?? "";
  let number = existing?.doc.number ?? "";

  if (existing) {
    await db
      .update(documents)
      .set({
        clientId,
        type: data.type,
        issueDate: data.issueDate,
        dueDate: data.dueDate || null,
        discountPercent: String(isBL ? 0 : data.discountPercent),
        vatPercent: String(isBL ? 0 : data.vatPercent),
        subtotal: String(totals.subtotal),
        discountAmount: String(totals.discountAmount),
        vatAmount: String(totals.vatAmount),
        total: String(totals.total),
        note: data.note || null,
        paymentMethods: isBL ? [] : data.paymentMethods,
        deliveryAddress: data.deliveryAddress || null,
        deliveredBy: data.deliveredBy || null,
      })
      .where(and(eq(documents.id, existing.doc.id), eq(documents.userId, userId)));

    await db.delete(documentItems).where(eq(documentItems.documentId, existing.doc.id));
    await db.delete(installments).where(eq(installments.documentId, existing.doc.id));
    documentId = existing.doc.id;
  } else {
    const limitCheck = await assertCanCreateDocument(userId);
    if (!limitCheck.ok) {
      return { ok: false, error: limitCheck.error };
    }

    const year = Number(data.issueDate.slice(0, 4));
    number = await nextNumber(userId, data.type as DocType, year);

    const inserted = await db
      .insert(documents)
      .values({
        userId: userId,
        clientId,
        type: data.type,
        number,
        status: isBL ? "draft" : "draft",
        issueDate: data.issueDate,
        dueDate: data.dueDate || null,
        discountPercent: String(isBL ? 0 : data.discountPercent),
        vatPercent: String(isBL ? 0 : data.vatPercent),
        subtotal: String(totals.subtotal),
        discountAmount: String(totals.discountAmount),
        vatAmount: String(totals.vatAmount),
        total: String(totals.total),
        note: data.note || null,
        paymentMethods: isBL ? [] : data.paymentMethods,
        deliveryAddress: data.deliveryAddress || null,
        deliveredBy: data.deliveredBy || null,
        shareToken: newShareToken(),
      })
      .returning({ id: documents.id });

    documentId = inserted[0].id;
  }

  // Lignes
  const positions = data.lines.map((line, index) => ({
    documentId,
    position: index,
    description: line.description,
    quantity: String(line.quantity),
    unitPrice: String(isBL ? 0 : line.unitPrice),
  }));
  await db.insert(documentItems).values(positions);

  // Tranches (aucune pour un bon de livraison)
  if (!isBL) {
    await db.insert(installments).values(
      plan.map((item) => ({
        documentId,
        position: item.position,
        label: item.label,
        amount: String(item.amount),
        dueDate: item.dueDate || data.dueDate || null,
      }))
    );
  }

  await refreshStatus(documentId);
  return { ok: true, id: documentId, number };
}

