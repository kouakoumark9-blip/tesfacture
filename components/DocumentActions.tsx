"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Send,
  CheckCircle2,
  Copy,
  Pencil,
  Trash2,
  FileDown,
  FilePlus2,
  Loader2,
  XCircle,
} from "lucide-react";
import type { Document } from "@/lib/types";
import {
  setStatus,
  duplicateDocument,
  convertQuoteToInvoice,
  removeDocument,
} from "@/lib/actions";

export default function DocumentActions({ doc }: { doc: Document }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const isDevis = doc.type === "devis";
  const base = isDevis ? "/devis" : "/factures";

  const run = (fn: () => Promise<unknown>, after?: () => void) =>
    startTransition(async () => {
      await fn();
      after?.();
      router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`${base}/${doc.id}/modifier`}
        className="btn-base border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      >
        <Pencil className="size-4" /> Modifier
      </Link>

      <a
        href={`/api/documents/${doc.id}/pdf`}
        className="btn-base border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      >
        <FileDown className="size-4" /> PDF
      </a>

      {doc.status === "brouillon" && (
        <button
          onClick={() => run(() => setStatus(doc.id, isDevis ? "envoye" : "envoyee"))}
          disabled={pending}
          className="btn-base bg-slate-900 text-white hover:bg-slate-800"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {isDevis ? "Marquer envoyé" : "Marquer envoyée"}
        </button>
      )}

      {!isDevis && doc.status === "envoyee" && (
        <button
          onClick={() => run(() => setStatus(doc.id, "payee"))}
          disabled={pending}
          className="btn-base bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          Marquer payée
        </button>
      )}

      {!isDevis && doc.status === "payee" && (
        <button
          onClick={() => run(() => setStatus(doc.id, "envoyee"))}
          disabled={pending}
          className="btn-base border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        >
          <XCircle className="size-4" /> Annuler l&apos;encaissement
        </button>
      )}

      {isDevis && doc.status !== "refuse" && (
        <>
          {!doc.convertedToId && (
            <button
              onClick={() =>
                run(async () => {
                  const res = await convertQuoteToInvoice(doc.id);
                  if (res.ok && res.id) router.push(`/factures/${res.id}`);
                })
              }
              disabled={pending}
              className="btn-base bg-brand-600 text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <FilePlus2 className="size-4" />}
              Convertir en facture
            </button>
          )}
          {doc.convertedToId && (
            <Link
              href={`/factures/${doc.convertedToId}`}
              className="btn-base border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            >
              <CheckCircle2 className="size-4" /> Voir la facture
            </Link>
          )}
          <button
            onClick={() => run(() => setStatus(doc.id, "refuse"))}
            disabled={pending}
            className="btn-base border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <XCircle className="size-4" /> Refusé
          </button>
        </>
      )}

      <button
        onClick={() => run(() => duplicateDocument(doc.id))}
        disabled={pending}
        className="btn-base border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      >
        <Copy className="size-4" /> Dupliquer
      </button>

      {confirming ? (
        <span className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-2 py-1.5">
          <span className="pl-1 text-[12.5px] font-medium text-rose-700">Supprimer ?</span>
          <button
            onClick={() => run(() => removeDocument(doc.id, base))}
            disabled={pending}
            className="rounded-lg bg-rose-600 px-2.5 py-1 text-[12px] font-semibold text-white hover:bg-rose-700"
          >
            Oui
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="rounded-lg px-2 py-1 text-[12px] font-semibold text-rose-700 hover:bg-rose-100"
          >
            Non
          </button>
        </span>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="btn-base text-slate-500 hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 className="size-4" /> Supprimer
        </button>
      )}
    </div>
  );
}
