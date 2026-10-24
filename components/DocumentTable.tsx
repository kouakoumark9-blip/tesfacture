"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { clsx } from "clsx";
import type { Client, DocType, Document } from "@/lib/types";
import { docTotals, formatDate, isOverdue, num } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Initials } from "@/components/ui";

type Filter = { key: string; label: string };

export default function DocumentTable({
  documents,
  clients,
  type,
  currency,
}: {
  documents: Document[];
  clients: Client[];
  type: DocType;
  currency: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("tous");

  const filters: Filter[] =
    type === "facture"
      ? [
          { key: "tous", label: "Toutes" },
          { key: "envoyee", label: "En attente" },
          { key: "payee", label: "Payées" },
          { key: "retard", label: "En retard" },
          { key: "brouillon", label: "Brouillons" },
        ]
      : [
          { key: "tous", label: "Tous" },
          { key: "brouillon", label: "Brouillons" },
          { key: "envoye", label: "Envoyés" },
          { key: "accepte", label: "Acceptés" },
          { key: "refuse", label: "Refusés" },
        ];

  const clientById = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients]
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((doc) => {
      const client = clientById.get(doc.clientId);
      const haystack = `${doc.number} ${client?.company ?? ""} ${client?.name ?? ""}`.toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (status === "tous") return true;
      if (status === "retard") return isOverdue(doc);
      if (status === "envoyee") return doc.status === "envoyee";
      return doc.status === status;
    });
  }, [documents, query, status, clientById]);

  const displayedTotal = rows.reduce((s, d) => s + docTotals(d).total, 0);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => {
            const count =
              f.key === "tous"
                ? documents.length
                : f.key === "retard"
                  ? documents.filter(isOverdue).length
                  : documents.filter((d) => d.status === f.key).length;
            return (
              <button
                key={f.key}
                onClick={() => setStatus(f.key)}
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition",
                  status === f.key
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                )}
              >
                {f.label}
                <span
                  className={clsx(
                    "rounded px-1.5 text-[10.5px] font-bold",
                    status === f.key ? "bg-white/20" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un client, un numéro…"
            className="input-base pl-9"
            aria-label="Rechercher"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
            <SlidersHorizontal className="size-5" />
          </span>
          <p className="mt-4 text-[14px] font-semibold text-slate-800">Aucun résultat</p>
          <p className="mt-1 text-[13px] text-slate-500">
            Ajustez votre recherche ou changez de filtre.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11.5px] uppercase tracking-wide text-slate-400">
                <th className="px-5 py-2.5 font-semibold">Numéro</th>
                <th className="px-5 py-2.5 font-semibold">Client</th>
                <th className="px-5 py-2.5 font-semibold">Date</th>
                <th className="px-5 py-2.5 font-semibold">
                  {type === "facture" ? "Échéance" : "Validité"}
                </th>
                <th className="px-5 py-2.5 text-right font-semibold">Montant</th>
                <th className="px-5 py-2.5 font-semibold">Statut</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((doc) => {
                const client = clientById.get(doc.clientId);
                const late = isOverdue(doc);
                return (
                  <tr key={doc.id} className="group transition hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <Link
                        href={`/${type === "facture" ? "factures" : "devis"}/${doc.id}`}
                        className="text-[13px] font-semibold text-slate-800 group-hover:text-brand-700"
                      >
                        {doc.number}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Initials
                          name={client?.company || client?.name || "?"}
                          className="size-8 text-[11px]"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-slate-800">
                            {client?.company || client?.name || "—"}
                          </p>
                          <p className="truncate text-[11.5px] text-slate-400">
                            {client?.name || client?.email || ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[12.5px] text-slate-500">
                      {formatDate(doc.issueDate)}
                    </td>
                    <td
                      className={clsx(
                        "px-5 py-3 text-[12.5px]",
                        late ? "font-semibold text-rose-600" : "text-slate-500"
                      )}
                    >
                      {formatDate(type === "facture" ? doc.dueDate : doc.validUntil)}
                    </td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-slate-800">
                      {num(docTotals(doc).total)}
                      <span className="ml-1 text-[10.5px] font-medium text-slate-400">
                        {currency}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge doc={doc} />
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/${type === "facture" ? "factures" : "devis"}/${doc.id}`}
                        className="grid size-8 place-items-center rounded-lg text-slate-400 opacity-0 transition hover:bg-white hover:text-brand-600 group-hover:opacity-100"
                        aria-label="Ouvrir"
                      >
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-100 bg-slate-50/60">
                <td colSpan={4} className="px-5 py-3 text-[12px] font-medium text-slate-500">
                  {rows.length} document{rows.length > 1 ? "s" : ""}
                </td>
                <td className="px-5 py-3 text-right text-[13px] font-bold text-slate-900">
                  {num(displayedTotal)}
                  <span className="ml-1 text-[10.5px] font-medium text-slate-400">{currency}</span>
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
