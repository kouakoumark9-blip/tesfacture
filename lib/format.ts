import type { Document, Line, Totals } from "./types";

const nf0 = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const nf2 = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1 250 000 FCFA */
export function money(amount: number, currency = "FCFA"): string {
  const rounded = Math.round(amount);
  return `${nf0.format(rounded)} ${currency}`;
}

/** 1 250 000 (sans devise, pour les tableaux) */
export function num(amount: number): string {
  return nf0.format(Math.round(amount));
}

export function num2(amount: number): string {
  return nf2.format(amount);
}

export function lineTotal(line: Line): number {
  return (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
}

export function lineVat(line: Line): number {
  return lineTotal(line) * ((Number(line.vatRate) || 0) / 100);
}

export function docTotals(doc: Pick<Document, "lines">): Totals {
  const subtotal = doc.lines.reduce((s, l) => s + lineTotal(l), 0);
  const vat = doc.lines.reduce((s, l) => s + lineVat(l), 0);
  return { subtotal, vat, total: subtotal + vat };
}

/** "2026-10-24" -> "24 oct. 2026" */
export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateLong(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isOverdue(doc: Document): boolean {
  if (doc.type !== "facture") return false;
  if (doc.status === "payee" || doc.status === "annulee" || doc.status === "brouillon") return false;
  return doc.dueDate < today();
}

export function daysLate(doc: Document): number {
  if (!isOverdue(doc)) return 0;
  const due = new Date(`${doc.dueDate}T12:00:00`).getTime();
  const now = new Date(`${today()}T12:00:00`).getTime();
  return Math.max(0, Math.round((now - due) / 86_400_000));
}

export function monthLabel(iso: string): string {
  const d = new Date(`${iso}-01T12:00:00`);
  return d.toLocaleDateString("fr-FR", { month: "short" });
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function daysUntil(iso: string): number {
  const target = new Date(`${iso}T12:00:00`).getTime();
  const now = new Date(`${today()}T12:00:00`).getTime();
  return Math.round((target - now) / 86_400_000);
}
