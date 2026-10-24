"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { clients, documents, documentItems, installments } from "@/db/schema";
import { requireUser } from "@/lib/session";
import type { DocumentInput } from "@/lib/validation";
import { saveDocumentForUser, type SaveResult } from "@/lib/documents-service";
import {
  getDocumentForUser,
  newShareToken,
  nextNumber,
  refreshStatus,
  type DocType,
} from "@/lib/documents";
import { buildInstallments, computeTotals, type DocStatus } from "@/lib/calc";
import { todayISO, addDaysISO } from "@/lib/format";

function revalidateDocuments(id?: string) {
  for (const path of ["/app", "/app/documents", "/app/factures", "/app/devis", "/app/livraisons"]) {
    revalidatePath(path);
  }
  if (id) {
    revalidatePath(`/app/documents/${id}`);
    revalidatePath(`/app/documents/${id}/modifier`);
  }
}

/** Crée ou met à jour un client à partir de la saisie de l'étape 1. */
export async function saveDocumentAction(input: DocumentInput): Promise<SaveResult> {
  const user = await requireUser();
  const result = await saveDocumentForUser(user.id, input);
  if (result.ok) {
    revalidateDocuments(result.id);
  }
  return result;
}

export async function markDocumentSent(documentId: string) {
  const user = await requireUser();
  const bundle = await getDocumentForUser(documentId, user.id);
  if (!bundle) return { ok: false as const, error: "Document introuvable." };

  const db = await getDb();
  const nextStatus = bundle.doc.type === "BL" ? "delivered" : "sent";
  await db
    .update(documents)
    .set({ status: nextStatus })
    .where(and(eq(documents.id, documentId), eq(documents.userId, user.id)));
  await refreshStatus(documentId);
  revalidateDocuments(documentId);
  return { ok: true as const };
}

export async function setDocumentStatus(documentId: string, status: DocStatus) {
  const user = await requireUser();
  const bundle = await getDocumentForUser(documentId, user.id);
  if (!bundle) return { ok: false as const, error: "Document introuvable." };

  const allowed: DocStatus[] = ["draft", "sent", "partial", "paid", "overdue", "cancelled", "delivered"];
  if (!allowed.includes(status)) return { ok: false as const, error: "Statut inconnu." };

  const db = await getDb();
  await db
    .update(documents)
    .set({ status })
    .where(and(eq(documents.id, documentId), eq(documents.userId, user.id)));
  revalidateDocuments(documentId);
  return { ok: true as const };
}

/** Marque une tranche comme payée (ou annule le paiement). */
export async function toggleInstallmentPaid(
  installmentId: string,
  paid: boolean,
  method?: string
) {
  const user = await requireUser();
  const db = await getDb();

  const rows = await db
    .select({ installment: installments, doc: documents })
    .from(installments)
    .innerJoin(documents, eq(documents.id, installments.documentId))
    .where(and(eq(installments.id, installmentId), eq(documents.userId, user.id)))
    .limit(1);

  const found = rows[0];
  if (!found) return { ok: false as const, error: "Tranche introuvable." };

  await db
    .update(installments)
    .set({
      paidAt: paid ? new Date() : null,
      method: paid ? method || found.installment.method || "Espèces" : null,
    })
    .where(eq(installments.id, installmentId));

  await refreshStatus(found.doc.id);
  revalidateDocuments(found.doc.id);
  return { ok: true as const };
}

export async function deleteDocumentAction(documentId: string, redirectTo = "/app/documents") {
  const user = await requireUser();
  const db = await getDb();
  await db
    .delete(documents)
    .where(and(eq(documents.id, documentId), eq(documents.userId, user.id)));
  revalidateDocuments();
  redirect(redirectTo);
}

/** Duplique un document en brouillon, avec un nouveau numéro. */
export async function duplicateDocumentAction(documentId: string) {
  const user = await requireUser();
  const bundle = await getDocumentForUser(documentId, user.id);
  if (!bundle) return { ok: false as const, error: "Document introuvable." };

  const db = await getDb();
  const issueDate = todayISO();
  const number = await nextNumber(user.id, bundle.doc.type as DocType, Number(issueDate.slice(0, 4)));

  const inserted = await db
    .insert(documents)
    .values({
      userId: user.id,
      clientId: bundle.doc.clientId,
      type: bundle.doc.type,
      number,
      status: "draft",
      issueDate,
      dueDate: addDaysISO(issueDate, 30),
      discountPercent: bundle.doc.discountPercent,
      vatPercent: bundle.doc.vatPercent,
      subtotal: bundle.doc.subtotal,
      discountAmount: bundle.doc.discountAmount,
      vatAmount: bundle.doc.vatAmount,
      total: bundle.doc.total,
      note: bundle.doc.note,
      paymentMethods: bundle.doc.paymentMethods,
      deliveryAddress: bundle.doc.deliveryAddress,
      deliveredBy: bundle.doc.deliveredBy,
      sourceDocumentId: bundle.doc.id,
      shareToken: newShareToken(),
    })
    .returning({ id: documents.id });

  const newId = inserted[0].id;

  if (bundle.items.length > 0) {
    await db.insert(documentItems).values(
      bundle.items.map((item) => ({
        documentId: newId,
        position: item.position,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
    );
  }

  if (bundle.installments.length > 0) {
    await db.insert(installments).values(
      bundle.installments.map((item) => ({
        documentId: newId,
        position: item.position,
        label: item.label,
        amount: item.amount,
        dueDate: addDaysISO(issueDate, 30),
      }))
    );
  }

  revalidateDocuments(newId);
  return { ok: true as const, id: newId };
}

/** Transforme un devis en facture (mêmes lignes, mêmes tranches). */
export async function quoteToInvoiceAction(quoteId: string) {
  const user = await requireUser();
  const bundle = await getDocumentForUser(quoteId, user.id);
  if (!bundle || bundle.doc.type !== "DEV") {
    return { ok: false as const, error: "Devis introuvable." };
  }

  const db = await getDb();
  const issueDate = todayISO();
  const number = await nextNumber(user.id, "FAC", Number(issueDate.slice(0, 4)));

  const inserted = await db
    .insert(documents)
    .values({
      userId: user.id,
      clientId: bundle.doc.clientId,
      type: "FAC",
      number,
      status: "draft",
      issueDate,
      dueDate: addDaysISO(issueDate, 30),
      discountPercent: bundle.doc.discountPercent,
      vatPercent: bundle.doc.vatPercent,
      subtotal: bundle.doc.subtotal,
      discountAmount: bundle.doc.discountAmount,
      vatAmount: bundle.doc.vatAmount,
      total: bundle.doc.total,
      note: bundle.doc.note,
      paymentMethods: bundle.doc.paymentMethods,
      sourceDocumentId: bundle.doc.id,
      shareToken: newShareToken(),
    })
    .returning({ id: documents.id });

  const newId = inserted[0].id;

  await db.insert(documentItems).values(
    bundle.items.map((item) => ({
      documentId: newId,
      position: item.position,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }))
  );

  const plan =
    bundle.installments.length > 0
      ? bundle.installments.map((item) => ({
          label: item.label,
          amount: Number(item.amount),
        }))
      : buildInstallments(Number(bundle.doc.total), 1, 0);

  await db.insert(installments).values(
    plan.map((item, index) => ({
      documentId: newId,
      position: index,
      label: item.label,
      amount: String(item.amount),
      dueDate: addDaysISO(issueDate, 30),
    }))
  );

  revalidateDocuments(newId);
  revalidatePath(`/app/documents/${quoteId}`);
  return { ok: true as const, id: newId };
}

/** Crée un bon de livraison depuis une facture (mêmes articles, sans prix). */
export async function invoiceToDeliveryAction(invoiceId: string) {
  const user = await requireUser();
  const bundle = await getDocumentForUser(invoiceId, user.id);
  if (!bundle || bundle.doc.type !== "FAC") {
    return { ok: false as const, error: "Facture introuvable." };
  }

  const db = await getDb();
  const issueDate = todayISO();
  const number = await nextNumber(user.id, "BL", Number(issueDate.slice(0, 4)));

  const inserted = await db
    .insert(documents)
    .values({
      userId: user.id,
      clientId: bundle.doc.clientId,
      type: "BL",
      number,
      status: "draft",
      issueDate,
      dueDate: null,
      discountPercent: "0",
      vatPercent: "0",
      subtotal: "0",
      discountAmount: "0",
      vatAmount: "0",
      total: "0",
      note: bundle.doc.note,
      paymentMethods: [],
      deliveryAddress: bundle.client?.address ?? null,
      deliveredBy: null,
      sourceDocumentId: bundle.doc.id,
      shareToken: newShareToken(),
    })
    .returning({ id: documents.id });

  const newId = inserted[0].id;

  await db.insert(documentItems).values(
    bundle.items.map((item) => ({
      documentId: newId,
      position: item.position,
      description: item.description,
      quantity: item.quantity,
      unitPrice: "0",
    }))
  );

  revalidateDocuments(newId);
  revalidatePath(`/app/documents/${invoiceId}`);
  return { ok: true as const, id: newId };
}

/** Charge un document complet pour l'édition (client + lignes + tranches). */
export async function loadDocumentForEdit(documentId: string) {
  const user = await requireUser();
  return getDocumentForUser(documentId, user.id);
}

/** Liste triée pour l'autocomplétion du carnet de clients. */
export async function searchClients(query: string) {
  const user = await requireUser();
  const db = await getDb();
  const rows = await db
    .select()
    .from(clients)
    .where(eq(clients.userId, user.id))
    .orderBy(asc(clients.name));
  const q = query.trim().toLowerCase();
  if (!q) return rows.slice(0, 8);
  return rows
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) || (c.phone ?? "").toLowerCase().includes(q)
    )
    .slice(0, 8);
}

export type EditableDocument = {
  id: string;
  type: DocType;
  number: string;
  status: string;
  issueDate: string;
  dueDate: string;
  discountPercent: number;
  vatPercent: number;
  note: string;
  paymentMethods: string[];
  deliveryAddress: string;
  deliveredBy: string;
  clientId: string | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  lines: { description: string; quantity: number; unitPrice: number }[];
  installments: { label: string; amount: number; dueDate: string; paidAt: string | null }[];
};

export async function toEditable(bundle: NonNullable<Awaited<ReturnType<typeof getDocumentForUser>>>): Promise<EditableDocument> {
  return {
    id: bundle.doc.id,
    type: bundle.doc.type as DocType,
    number: bundle.doc.number,
    status: bundle.doc.status,
    issueDate: bundle.doc.issueDate,
    dueDate: bundle.doc.dueDate ?? "",
    discountPercent: Number(bundle.doc.discountPercent),
    vatPercent: Number(bundle.doc.vatPercent),
    note: bundle.doc.note ?? "",
    paymentMethods: bundle.doc.paymentMethods ?? [],
    deliveryAddress: bundle.doc.deliveryAddress ?? "",
    deliveredBy: bundle.doc.deliveredBy ?? "",
    clientId: bundle.doc.clientId,
    clientName: bundle.client?.name ?? "",
    clientPhone: bundle.client?.phone ?? "",
    clientEmail: bundle.client?.email ?? "",
    clientAddress: bundle.client?.address ?? "",
    lines: bundle.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    })),
    installments: bundle.installments.map((item) => ({
      label: item.label,
      amount: Number(item.amount),
      dueDate: item.dueDate ?? "",
      paidAt: item.paidAt ? item.paidAt.toISOString() : null,
    })),
  };
}

