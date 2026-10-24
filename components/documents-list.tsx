"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, FileText, Plus, Search, SlidersHorizontal } from "lucide-react";
import { clsx } from "clsx";
import { amount, dateShort } from "@/lib/format";
import { DOC_TYPE_LABEL, STATUS_LABEL, STATUS_TONE } from "@/lib/preview";
import { Badge, EmptyState } from "./ui";

export type DocumentRow = {
  id: string;
  type: "FAC" | "DEV" | "BL";
  number: string;
  status: string;
  issueDate: string;
  dueDate: string | null;
  total: number;
  clientName: string;
  paidCount: number;
  installmentCount: number;
};

type Props = {
  documents: DocumentRow[];
  type?: "FAC" | "DEV" | "BL";
  showTypeFilter?: boolean;
  title: string;
  subtitle: string;
  createHref: string;
  createLabel: string;
};

const STATUS_FILTERS = [
  { key: "all", label: "Tous" },
  { key: "draft", label: "Brouillons" },
  { key: "sent", label: "Envoyés" },
  { key: "partial", label: "Partiels" },
  { key: "paid", label: "Payés" },
  { key: "overdue", label: "En retard" },
  { key: "delivered", label: "Livrés" },
  { key: "cancelled", label: "Annulés" },
];

export default function DocumentsList({
  documents,
  type,
  showTypeFilter = false,
  title,
  subtitle,
  createHref,
  createLabel,
}: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "FAC" | "DEV" | "BL">(type ?? "all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((row) => {
      if (status !== "all" && row.status !== status) return false;
      if (typeFilter !== "all" && row.type !== typeFilter) return false;
      if (q && !`${row.number} ${row.clientName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [documents, query, status, typeFilter]);

  const totalAmount = rows.reduce((sum, row) => sum + (row.type === "BL" ? 0 : row.total), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[23px] font-extrabold tracking-tight">{title}</h1>
          <p className="mt-0.5 text-[13px] text-slate-600">{subtitle}</p>
        </div>
        <Link href={createHref} className="btn min-h-11 bg-brand-500 px-4 text-[14px] text-white hover:bg-brand-600">
          <Plus className="size-4" /> {createLabel}
        </Link>
      </div>

      <div className="card space-y-3 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un client ou un numéro…"
            className="field min-h-11 pl-10 text-[14px]"
            aria-label="Rechercher un document"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.filter((f) =>
            type === "BL" ? f.key === "all" || f.key === "delivered" || f.key === "draft" : true
          ).map((filter) => (
            <button
              key={filter.key}
              onClick={() => setStatus(filter.key)}
              className={clsx(
                "min-h-9 rounded-full border px-3 text-[12px] font-semibold transition",
                status === filter.key
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-black/10 bg-white text-slate-600 hover:bg-black/[0.02]"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {showTypeFilter && (
          <div className="flex flex-wrap gap-1.5 border-t border-black/5 pt-2.5">
            {(["all", "FAC", "DEV", "BL"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setTypeFilter(value)}
                className={clsx(
                  "rounded-lg px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wide transition",
                  typeFilter === value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                {value === "all" ? "Tous types" : DOC_TYPE_LABEL[value]}
              </button>
            ))}
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FileText className="size-5" />}
            title={documents.length === 0 ? "Aucun document pour l'instant" : "Aucun résultat"}
            description={
              documents.length === 0
                ? "Créez votre première facture : 3 étapes, moins de 2 minutes."
                : "Modifiez votre recherche ou changez de filtre."
            }
            action={
              documents.length === 0 ? (
                <Link href={createHref} className="btn w-full bg-brand-500 text-white hover:bg-brand-600">
                  {createLabel}
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setQuery("");
                    setStatus("all");
                    setTypeFilter(type ?? "all");
                  }}
                  className="btn w-full border border-black/10 bg-white"
                >
                  <SlidersHorizontal className="size-4" /> Réinitialiser les filtres
                </button>
              )
            }
          />
        </div>
      ) : (
        <>
          <p className="text-[12px] font-medium text-slate-500">
            {rows.length} document{rows.length > 1 ? "s" : ""}
            {totalAmount > 0 && <> · {amount(totalAmount)} FCFA au total</>}
          </p>

          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/app/documents/${row.id}`}
                  className="card flex items-center gap-3 p-3.5 transition hover:border-brand-200 hover:shadow-md hover:shadow-brand-900/5"
                >
                  <span
                    className={clsx(
                      "grid size-10 shrink-0 place-items-center rounded-xl text-[10px] font-black",
                      row.type === "FAC"
                        ? "bg-brand-50 text-brand-700"
                        : row.type === "DEV"
                          ? "bg-accent-50 text-accent-700"
                          : "bg-sky-50 text-sky-700"
                    )}
                  >
                    {row.type}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13.5px] font-bold">{row.number}</p>
                      <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>
                        {STATUS_LABEL[row.status] ?? row.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-[12.5px] text-slate-500">
                      {row.clientName} · {dateShort(row.issueDate)}
                      {row.type !== "BL" && row.installmentCount > 1 && (
                        <> · {row.paidCount}/{row.installmentCount} tranches</>
                      )}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {row.type === "BL" ? (
                      <p className="text-[12px] font-medium text-slate-400">Sans montant</p>
                    ) : (
                      <p className="text-[14px] font-extrabold text-slate-900">
                        {amount(row.total)}
                        <span className="ml-0.5 text-[10px] font-semibold text-slate-400">FCFA</span>
                      </p>
                    )}
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
