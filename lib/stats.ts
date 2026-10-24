/**
 * Agrégats du tableau de bord — fonctions pures, testées (lib/stats.test.ts).
 *
 * Définitions (à respecter partout) :
 * - Facturé   : total des factures (FAC) non annulées émises sur la période.
 * - Encaissé  : somme des tranches dont paid_at est dans la période.
 * - À encaisser : total des factures non annulées − tranches déjà payées.
 * - En retard : tranches non payées dont l'échéance est dépassée.
 * - Devis et bons de livraison ne comptent jamais dans le chiffre d'affaires.
 */
import type { Period } from "./period";
import { inRange } from "./period";
import { todayISO } from "./format";

export type StatsDoc = {
  id: string;
  type: string;
  status: string;
  number: string;
  total: number;
  clientId: string | null;
  clientName: string;
  issueDate: string;
  dueDate: string | null;
  paymentMethods: string[];
  createdAt: string;
};

export type StatsInstallment = {
  id: string;
  documentId: string;
  label: string;
  amount: number;
  dueDate: string | null;
  paidAt: string | null; // YYYY-MM-DD
  method: string | null;
};

export type DashboardMetrics = {
  billed: number;
  collected: number;
  toCollect: number;
  overdueAmount: number;
  overdueCount: number;
  quotesPending: number;
  quotesSent: number;
  deliveryNotes: number;
  documentsCount: number;
};

export type MonthPoint = { key: string; label: string; billed: number; collected: number };

export function computeMetrics(
  docs: StatsDoc[],
  parts: StatsInstallment[],
  period: Period
): DashboardMetrics {
  const invoices = docs.filter((d) => d.type === "FAC" && d.status !== "cancelled");
  const periodInvoices = invoices.filter((d) => inRange(d.issueDate, period));
  const periodParts = parts.filter((p) => p.paidAt && inRange(p.paidAt, period));

  const docById = new Map(docs.map((d) => [d.id, d]));

  const billed = periodInvoices.reduce((sum, d) => sum + d.total, 0);
  const collected = periodParts.reduce((sum, p) => sum + p.amount, 0);

  // À encaisser : factures de la période, moins ce qui est déjà réglé (toutes périodes)
  const toCollect = periodInvoices.reduce((sum, doc) => {
    const paid = parts
      .filter((p) => p.documentId === doc.id && p.paidAt)
      .reduce((s, p) => s + p.amount, 0);
    return sum + Math.max(0, doc.total - paid);
  }, 0);

  const today = todayISO();
  const overdueParts = parts.filter((p) => {
    if (p.paidAt) return false;
    const doc = docById.get(p.documentId);
    if (!doc || doc.type !== "FAC" || doc.status === "cancelled") return false;
    return Boolean(p.dueDate && p.dueDate < today);
  });

  const overdueAmount = overdueParts.reduce((sum, p) => sum + p.amount, 0);
  const overdueCount = new Set(overdueParts.map((p) => p.documentId)).size;

  const quotes = docs.filter((d) => d.type === "DEV");
  const quotesPending = quotes.filter(
    (d) => d.status === "sent" && inRange(d.issueDate, period)
  ).length;
  const quotesSent = quotes.filter((d) => d.status !== "draft").length;

  return {
    billed,
    collected,
    toCollect,
    overdueAmount,
    overdueCount,
    quotesPending,
    quotesSent,
    deliveryNotes: docs.filter((d) => d.type === "BL" && inRange(d.issueDate, period)).length,
    documentsCount: docs.filter((d) => inRange(d.issueDate, period)).length,
  };
}

/** Taux de conversion réel : devis transformés en facture / devis envoyés. */
export function quoteConversion(
  docs: StatsDoc[],
  convertedQuoteCount: number
): number | null {
  const sentQuotes = docs.filter(
    (d) => d.type === "DEV" && d.status !== "draft" && d.status !== "cancelled"
  ).length;
  if (sentQuotes === 0) return null;
  return Math.round((convertedQuoteCount / sentQuotes) * 100);
}

/** 12 derniers mois (facturé / encaissé). */
export function monthlySeries(
  docs: StatsDoc[],
  parts: StatsInstallment[],
  months = 12,
  nowISO = todayISO()
): MonthPoint[] {
  const current = new Date(`${nowISO.slice(0, 7)}-01T12:00:00Z`);
  const out: MonthPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(current);
    d.setUTCMonth(d.getUTCMonth() - i);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = d
      .toLocaleDateString("fr-FR", { month: "short", timeZone: "UTC" })
      .replace(".", "");

    const billed = docs
      .filter((doc) => doc.type === "FAC" && doc.status !== "cancelled" && doc.issueDate.slice(0, 7) === key)
      .reduce((sum, doc) => sum + doc.total, 0);

    const collected = parts
      .filter((p) => p.paidAt && p.paidAt.slice(0, 7) === key)
      .reduce((sum, p) => sum + p.amount, 0);

    out.push({ key, label, billed, collected });
  }

  return out;
}

/** Répartition de l'encaissement par moyen de paiement. */
export function paymentBreakdown(
  parts: StatsInstallment[],
  period: Period
): { method: string; amount: number }[] {
  const map = new Map<string, number>();
  for (const part of parts) {
    if (!part.paidAt || !inRange(part.paidAt, period)) continue;
    const method = part.method || "Non précisé";
    map.set(method, (map.get(method) ?? 0) + part.amount);
  }
  return [...map.entries()]
    .map(([method, amount]) => ({ method, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/** 5 meilleurs clients par montant facturé sur la période. */
export function topClientsByBilled(
  docs: StatsDoc[],
  period: Period,
  limit = 5
): { clientId: string; name: string; billed: number; documents: number }[] {
  const map = new Map<string, { name: string; billed: number; documents: number }>();
  for (const doc of docs) {
    if (doc.type !== "FAC" || doc.status === "cancelled") continue;
    if (!inRange(doc.issueDate, period)) continue;
    const key = doc.clientId ?? doc.clientName;
    const entry = map.get(key) ?? { name: doc.clientName, billed: 0, documents: 0 };
    entry.billed += doc.total;
    entry.documents += 1;
    map.set(key, entry);
  }
  return [...map.entries()]
    .map(([clientId, value]) => ({ clientId, ...value }))
    .sort((a, b) => b.billed - a.billed)
    .slice(0, limit);
}
