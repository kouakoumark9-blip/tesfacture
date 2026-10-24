"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Client, DocType, Document, Line, Settings } from "./types";
import {
  db,
  deleteClient,
  deleteDocument,
  nextNumber,
  newId,
  saveClient,
  saveDocument,
  getDocument,
  updateSettings,
  resetDatabase,
} from "./store";
import { addDays, today } from "./format";

export type DocInput = {
  type: DocType;
  clientId: string;
  issueDate: string;
  dueDate: string;
  validUntil?: string;
  notes: string;
  lines: { description: string; quantity: number; unitPrice: number; vatRate: number }[];
};

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function revalidateAll() {
  for (const path of ["/dashboard", "/factures", "/devis", "/clients", "/parametres"]) {
    revalidatePath(path);
  }
}

function normalizeLines(lines: DocInput["lines"]): Line[] {
  return lines
    .filter((l) => l.description.trim().length > 0)
    .map((l) => ({
      id: newId("ln"),
      description: l.description.trim(),
      quantity: Math.max(0, Number(l.quantity) || 0),
      unitPrice: Math.max(0, Number(l.unitPrice) || 0),
      vatRate: Math.max(0, Number(l.vatRate) || 0),
    }));
}

export async function createDocument(input: DocInput): Promise<ActionResult> {
  const lines = normalizeLines(input.lines);
  if (!input.clientId) return { ok: false, error: "Veuillez sélectionner un client." };
  if (lines.length === 0) return { ok: false, error: "Ajoutez au moins une ligne." };

  const issueDate = input.issueDate || today();
  const doc: Document = {
    id: newId("doc"),
    type: input.type,
    number: nextNumber(input.type, issueDate),
    clientId: input.clientId,
    issueDate,
    dueDate: input.dueDate || addDays(issueDate, 30),
    validUntil: input.type === "devis" ? input.validUntil || addDays(issueDate, 15) : undefined,
    lines,
    notes: input.notes?.trim() ?? "",
    status: "brouillon",
    createdAt: new Date().toISOString(),
    paidAt: null,
  };

  saveDocument(doc);
  revalidateAll();
  return { ok: true, id: doc.id };
}

export async function updateDocument(id: string, input: DocInput): Promise<ActionResult> {
  const existing = getDocument(id);
  if (!existing) return { ok: false, error: "Document introuvable." };
  const lines = normalizeLines(input.lines);
  if (!input.clientId) return { ok: false, error: "Veuillez sélectionner un client." };
  if (lines.length === 0) return { ok: false, error: "Ajoutez au moins une ligne." };

  saveDocument({
    ...existing,
    clientId: input.clientId,
    issueDate: input.issueDate || existing.issueDate,
    dueDate: input.dueDate || existing.dueDate,
    validUntil: input.type === "devis" ? input.validUntil : existing.validUntil,
    notes: input.notes?.trim() ?? "",
    lines,
  });
  revalidateAll();
  revalidatePath(`/factures/${id}`);
  revalidatePath(`/devis/${id}`);
  return { ok: true, id };
}

export async function setStatus(id: string, status: string): Promise<ActionResult> {
  const existing = getDocument(id);
  if (!existing) return { ok: false, error: "Document introuvable." };
  const allowed = ["brouillon", "envoyee", "payee", "annulee", "envoye", "accepte", "refuse"];
  if (!allowed.includes(status)) return { ok: false, error: "Statut inconnu." };

  saveDocument({
    ...existing,
    status: status as Document["status"],
    paidAt: status === "payee" ? new Date().toISOString().slice(0, 10) : null,
  });
  revalidateAll();
  revalidatePath(`/factures/${id}`);
  revalidatePath(`/devis/${id}`);
  return { ok: true };
}

export async function markPaid(id: string) {
  await setStatus(id, "payee");
}

export async function removeDocument(id: string, redirectTo?: string) {
  deleteDocument(id);
  revalidateAll();
  if (redirectTo) redirect(redirectTo);
}

export async function duplicateDocument(id: string): Promise<ActionResult> {
  const existing = getDocument(id);
  if (!existing) return { ok: false, error: "Document introuvable." };
  const issue = today();
  const copy: Document = {
    ...existing,
    id: newId("doc"),
    number: nextNumber(existing.type, issue),
    issueDate: issue,
    dueDate: addDays(issue, 30),
    validUntil: existing.type === "devis" ? addDays(issue, 15) : undefined,
    status: "brouillon",
    paidAt: null,
    convertedToId: null,
    createdAt: new Date().toISOString(),
    lines: existing.lines.map((l) => ({ ...l, id: newId("ln") })),
  };
  saveDocument(copy);
  revalidateAll();
  return { ok: true, id: copy.id };
}

export async function convertQuoteToInvoice(id: string): Promise<ActionResult> {
  const quote = getDocument(id);
  if (!quote || quote.type !== "devis") return { ok: false, error: "Devis introuvable." };
  const issue = today();
  const invoice: Document = {
    id: newId("doc"),
    type: "facture",
    number: nextNumber("facture", issue),
    clientId: quote.clientId,
    issueDate: issue,
    dueDate: addDays(issue, 30),
    lines: quote.lines.map((l) => ({ ...l, id: newId("ln") })),
    notes: quote.notes,
    status: "brouillon",
    createdAt: new Date().toISOString(),
    paidAt: null,
    sourceQuoteId: quote.id,
  };
  saveDocument(invoice);
  saveDocument({ ...quote, status: "accepte", convertedToId: invoice.id });
  revalidateAll();
  revalidatePath(`/devis/${id}`);
  return { ok: true, id: invoice.id };
}

export type ClientInput = Omit<Client, "id" | "createdAt"> & { id?: string };

export async function saveClientAction(input: ClientInput): Promise<ActionResult> {
  if (!input.name?.trim() && !input.company?.trim()) {
    return { ok: false, error: "Renseignez au moins un nom ou une entreprise." };
  }
  const client: Client = {
    id: input.id || newId("cli"),
    name: input.name?.trim() ?? "",
    company: input.company?.trim() ?? "",
    email: input.email?.trim() ?? "",
    phone: input.phone?.trim() ?? "",
    address: input.address?.trim() ?? "",
    city: input.city?.trim() ?? "",
    country: input.country?.trim() || "Côte d'Ivoire",
    taxId: input.taxId?.trim() ?? "",
    notes: input.notes?.trim() ?? "",
    createdAt: new Date().toISOString().slice(0, 10),
  };
  if (input.id) {
    const existing = db().clients.find((c) => c.id === input.id);
    if (existing) client.createdAt = existing.createdAt;
  }
  saveClient(client);
  revalidateAll();
  revalidatePath(`/clients/${client.id}`);
  return { ok: true, id: client.id };
}

export async function deleteClientAction(id: string, redirectTo?: string) {
  deleteClient(id);
  revalidateAll();
  if (redirectTo) redirect(redirectTo);
}

export async function saveSettingsAction(patch: Partial<Settings>): Promise<ActionResult> {
  updateSettings(patch);
  revalidateAll();
  revalidatePath("/");
  return { ok: true };
}

export async function resetDemoData(): Promise<ActionResult> {
  resetDatabase();
  revalidateAll();
  return { ok: true };
}
