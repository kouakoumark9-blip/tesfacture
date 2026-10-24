import { clsx } from "clsx";
import type { Document, StatusTone } from "@/lib/types";
import { daysLate, isOverdue } from "@/lib/format";

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function statusMeta(doc: Document): { label: string; tone: StatusTone; dot: string } {
  if (doc.type === "devis") {
    switch (doc.status) {
      case "accepte":
        return { label: "Accepté", tone: "success", dot: "bg-emerald-500" };
      case "refuse":
        return { label: "Refusé", tone: "danger", dot: "bg-rose-500" };
      case "envoye":
        return { label: "Envoyé", tone: "info", dot: "bg-sky-500" };
      default:
        return { label: "Brouillon", tone: "neutral", dot: "bg-slate-400" };
    }
  }

  if (doc.status === "payee") return { label: "Payée", tone: "success", dot: "bg-emerald-500" };
  if (doc.status === "annulee") return { label: "Annulée", tone: "neutral", dot: "bg-slate-400" };
  if (doc.status === "brouillon")
    return { label: "Brouillon", tone: "neutral", dot: "bg-slate-400" };
  if (isOverdue(doc)) {
    const late = daysLate(doc);
    return {
      label: late > 0 ? `En retard · ${late} j` : "En retard",
      tone: "danger",
      dot: "bg-rose-500",
    };
  }
  return { label: "Envoyée", tone: "warning", dot: "bg-amber-500" };
}

export function StatusBadge({ doc }: { doc: Document }) {
  const meta = statusMeta(doc);
  return (
    <Badge tone={meta.tone}>
      <span className={clsx("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </Badge>
  );
}
