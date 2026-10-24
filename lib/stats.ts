import type { Client, Document } from "./types";
import { docTotals, isOverdue, today } from "./format";

export type MonthPoint = { key: string; label: string; paid: number; pending: number };

export function monthKey(iso: string) {
  return iso.slice(0, 7);
}

export function lastMonths(count = 6): { key: string; label: string }[] {
  const now = new Date(`${today().slice(0, 7)}-01T12:00:00`);
  const out: { key: string; label: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({
      key,
      label: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
    });
  }
  return out;
}

export function monthlySeries(invoices: Document[], count = 6): MonthPoint[] {
  const months = lastMonths(count);
  return months.map((m) => {
    const inMonth = invoices.filter((d) => monthKey(d.issueDate) === m.key);
    const paid = inMonth
      .filter((d) => d.status === "payee")
      .reduce((s, d) => s + docTotals(d).total, 0);
    const pending = inMonth
      .filter((d) => d.status !== "payee" && d.status !== "annulee")
      .reduce((s, d) => s + docTotals(d).total, 0);
    return { key: m.key, label: m.label, paid, pending };
  });
}

export type Kpis = {
  revenue: number;
  outstanding: number;
  overdue: number;
  overdueCount: number;
  quotesValue: number;
  quotesOpen: number;
  invoiceCount: number;
  paidCount: number;
  draftCount: number;
  averageBasket: number;
  growth: number | null;
};

export function computeKpis(docs: Document[]): Kpis {
  const invoices = docs.filter((d) => d.type === "facture");
  const quotes = docs.filter((d) => d.type === "devis");

  const paid = invoices.filter((d) => d.status === "payee");
  const revenue = paid.reduce((s, d) => s + docTotals(d).total, 0);

  const open = invoices.filter(
    (d) => d.status === "envoyee" || (d.status !== "payee" && d.status !== "annulee" && d.status !== "brouillon")
  );
  const overdueDocs = invoices.filter(isOverdue);

  const quotesOpenDocs = quotes.filter((d) => d.status === "brouillon" || d.status === "envoye");

  const series = monthlySeries(invoices, 2);
  const last = series[1]?.paid ?? 0;
  const prev = series[0]?.paid ?? 0;
  const growth = prev > 0 ? Math.round(((last - prev) / prev) * 100) : null;

  return {
    revenue,
    outstanding: open.reduce((s, d) => s + docTotals(d).total, 0),
    overdue: overdueDocs.reduce((s, d) => s + docTotals(d).total, 0),
    overdueCount: overdueDocs.length,
    quotesValue: quotesOpenDocs.reduce((s, d) => s + docTotals(d).total, 0),
    quotesOpen: quotesOpenDocs.length,
    invoiceCount: invoices.length,
    paidCount: paid.length,
    draftCount: invoices.filter((d) => d.status === "brouillon").length,
    averageBasket: paid.length ? revenue / paid.length : 0,
    growth,
  };
}

export function topClients(clients: Client[], docs: Document[], limit = 5) {
  const rows = clients
    .map((c) => {
      const own = docs.filter(
        (d) => d.type === "facture" && d.clientId === c.id && d.status === "payee"
      );
      return {
        client: c,
        total: own.reduce((s, d) => s + docTotals(d).total, 0),
        count: own.length,
      };
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);
  return rows.slice(0, limit);
}

export function clientStats(clientId: string, docs: Document[]) {
  const own = docs.filter((d) => d.clientId === clientId);
  const invoices = own.filter((d) => d.type === "facture");
  const paid = invoices.filter((d) => d.status === "payee");
  const outstanding = invoices
    .filter((d) => d.status === "envoyee" && !isOverdue(d))
    .reduce((s, d) => s + docTotals(d).total, 0);
  const due = invoices.filter(isOverdue).reduce((s, d) => s + docTotals(d).total, 0);
  return {
    documents: own.sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1)),
    revenue: paid.reduce((s, d) => s + docTotals(d).total, 0),
    outstanding,
    due,
    count: invoices.length,
  };
}
