import { todayISO } from "./format";

export type PeriodKey = "today" | "7d" | "month" | "lastmonth" | "year" | "custom";

export type Period = { key: PeriodKey; start: string; end: string; label: string };

export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Aujourd'hui" },
  { key: "7d", label: "7 jours" },
  { key: "month", label: "Ce mois" },
  { key: "lastmonth", label: "Mois dernier" },
  { key: "year", label: "Cette année" },
  { key: "custom", label: "Personnalisé" },
];

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Bornes incluses de la période, en dates ISO (YYYY-MM-DD). */
export function resolvePeriod(
  key: string | undefined,
  from?: string | null,
  to?: string | null
): Period {
  const today = todayISO();
  const current = new Date(`${today}T12:00:00Z`);
  const options = PERIOD_OPTIONS;

  const make = (k: PeriodKey, start: Date, end: Date): Period => ({
    key: k,
    start: iso(start),
    end: iso(end),
    label: options.find((o) => o.key === k)?.label ?? "Période",
  });

  switch (key) {
    case "7d": {
      const start = new Date(current);
      start.setUTCDate(start.getUTCDate() - 6);
      return make("7d", start, current);
    }
    case "month": {
      const start = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1, 12));
      const end = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0, 12));
      return make("month", start, end);
    }
    case "lastmonth": {
      const start = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 1, 1, 12));
      const end = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 0, 12));
      return make("lastmonth", start, end);
    }
    case "year": {
      const start = new Date(Date.UTC(current.getUTCFullYear(), 0, 1, 12));
      const end = new Date(Date.UTC(current.getUTCFullYear(), 11, 31, 12));
      return make("year", start, end);
    }
    case "custom": {
      const start = from || today;
      const end = to || today;
      return {
        key: "custom",
        start: start <= end ? start : end,
        end: start <= end ? end : start,
        label: "Personnalisé",
      };
    }
    default:
      return make("today", current, current);
  }
}

export function inRange(dateISO: string | null | undefined, period: Period): boolean {
  if (!dateISO) return false;
  const day = dateISO.slice(0, 10);
  return day >= period.start && day <= period.end;
}
