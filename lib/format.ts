/**
 * Formats partagés — français, FCFA, fuseau Africa/Abidjan.
 * Aucune dépendance serveur : utilisable dans les composants client.
 */

const TZ = "Africa/Abidjan";

const intFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** 60000 -> "60 000 FCFA" (espace insécable fine convertie en espace simple) */
export function money(amount: number | string | null | undefined, currency = "FCFA"): string {
  const value = Math.round(Number(amount) || 0);
  const formatted = intFormatter.format(value).replace(/\u202f|\u00a0/g, " ");
  return `${formatted} ${currency}`;
}

/** 60000 -> "60 000" */
export function amount(value: number | string | null | undefined): string {
  return intFormatter.format(Math.round(Number(value) || 0)).replace(/\u202f|\u00a0/g, " ");
}

/** Date ISO (YYYY-MM-DD) ou Date -> "24/10/2026" */
export function dateShort(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = toDate(value);
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TZ,
  }).format(d);
}

/** "24 octobre 2026" */
export function dateLong(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = toDate(value);
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(d);
}

/** "24/10/2026 à 14:32" */
export function dateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = toDate(value);
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  })
    .format(d)
    .replace(",", " à");
}

function toDate(value: string | Date): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  // Une date seule (YYYY-MM-DD) est interprétée à midi pour éviter les décalages
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00Z` : value;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date du jour (Africa/Abidjan) au format YYYY-MM-DD */
export function todayISO(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts; // en-CA => YYYY-MM-DD
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function addMonthsISO(iso: string, months: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromISO: string, toISODate: string): number {
  const a = new Date(`${fromISO}T12:00:00Z`).getTime();
  const b = new Date(`${toISODate}T12:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Nombre de jours entre aujourd'hui et une date ISO (négatif si passée). */
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return daysBetween(todayISO(), iso.slice(0, 10));
}

export function isPast(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return iso < todayISO();
}

export function monthLabel(key: string): string {
  // key = YYYY-MM
  const d = new Date(`${key}-01T12:00:00Z`);
  return new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: TZ })
    .format(d)
    .replace(".", "");
}

export function initials(name: string): string {
  return (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
