"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  Percent,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { clsx } from "clsx";
import type { Client, DocType, Document } from "@/lib/types";
import { addDays, num, today } from "@/lib/format";
import { createDocument, updateDocument } from "@/lib/actions";

type DraftLine = {
  key: string;
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
};

const uid = () => Math.random().toString(36).slice(2, 9);

function emptyLine(vatRate: number): DraftLine {
  return { key: uid(), description: "", quantity: "1", unitPrice: "", vatRate: String(vatRate) };
}

export default function DocumentEditor({
  type,
  clients,
  currency,
  defaultVatRate,
  paymentTerms,
  quoteValidity,
  document,
  nextNumberPreview,
}: {
  type: DocType;
  clients: Client[];
  currency: string;
  defaultVatRate: number;
  paymentTerms: number;
  quoteValidity: number;
  document?: Document;
  nextNumberPreview: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const initialDate = document?.issueDate ?? today();

  const [clientId, setClientId] = useState(document?.clientId ?? clients[0]?.id ?? "");
  const [issueDate, setIssueDate] = useState(initialDate);
  const [dueDate, setDueDate] = useState(
    document?.dueDate ?? addDays(initialDate, paymentTerms)
  );
  const [validUntil, setValidUntil] = useState(
    document?.validUntil ?? addDays(initialDate, quoteValidity)
  );
  const [notes, setNotes] = useState(document?.notes ?? "");
  const [lines, setLines] = useState<DraftLine[]>(
    document?.lines.length
      ? document.lines.map((l) => ({
          key: l.id,
          description: l.description,
          quantity: String(l.quantity),
          unitPrice: String(l.unitPrice),
          vatRate: String(l.vatRate),
        }))
      : [emptyLine(defaultVatRate)]
  );

  const totals = useMemo(() => {
    let subtotal = 0;
    let vat = 0;
    for (const l of lines) {
      const base = (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0);
      subtotal += base;
      vat += base * ((Number(l.vatRate) || 0) / 100);
    }
    return { subtotal, vat, total: subtotal + vat };
  }, [lines]);

  function patchLine(key: string, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine(defaultVatRate)]);
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((l) => l.key !== key)));
  }

  function onClientChange(id: string) {
    setClientId(id);
    if (id === "new") {
      router.push("/clients/nouveau");
    }
  }

  function submit() {
    setError(null);
    setSaved(false);

    const payload = {
      type,
      clientId,
      issueDate,
      dueDate,
      validUntil,
      notes,
      lines: lines.map((l) => ({
        description: l.description,
        quantity: Number(l.quantity) || 0,
        unitPrice: Number(l.unitPrice) || 0,
        vatRate: Number(l.vatRate) || 0,
      })),
    };

    startTransition(async () => {
      const result = document
        ? await updateDocument(document.id, payload)
        : await createDocument(payload);

      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      const base = type === "facture" ? "/factures" : "/devis";
      router.push(result.id ? `${base}/${result.id}` : base);
      router.refresh();
    });
  }

  const selectedClient = clients.find((c) => c.id === clientId);
  const base = type === "facture" ? "/factures" : "/devis";
  const isDevis = type === "devis";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={base}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="size-3.5" /> Retour aux {isDevis ? "devis" : "factures"}
          </Link>
          <h1 className="mt-2 text-[26px] font-bold tracking-tight text-slate-900">
            {document ? `Modifier ${document.number}` : isDevis ? "Nouveau devis" : "Nouvelle facture"}
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-500">
            Numéro attribué : <span className="font-semibold text-slate-700">{document?.number ?? nextNumberPreview}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={base} className="btn-base border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
            Annuler
          </Link>
          <button
            onClick={submit}
            disabled={pending}
            className="btn-base bg-brand-600 text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {document ? "Enregistrer" : "Créer le document"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
          <AlertCircle className="size-4" /> {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">
          <CheckCircle2 className="size-4" /> Enregistré.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* Client + dates */}
          <section className="card p-5">
            <h2 className="text-[15px] font-semibold text-slate-900">Informations générales</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12.5px] font-semibold text-slate-600">Client</label>
                <select
                  value={clientId}
                  onChange={(e) => onClientChange(e.target.value)}
                  className="input-base"
                >
                  {clients.length === 0 && <option value="">Aucun client — créez-en un</option>}
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company ? `${c.company} — ${c.name}` : c.name}
                    </option>
                  ))}
                  <option value="new">+ Ajouter un nouveau client…</option>
                </select>
                {selectedClient && (
                  <p className="mt-2 text-[12px] text-slate-500">
                    {[selectedClient.address, selectedClient.city, selectedClient.country]
                      .filter(Boolean)
                      .join(", ")}
                    {selectedClient.taxId ? ` · NCC ${selectedClient.taxId}` : ""}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-slate-600">
                  Date d&apos;émission
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => {
                    setIssueDate(e.target.value);
                    if (!document) {
                      setDueDate(addDays(e.target.value, paymentTerms));
                      setValidUntil(addDays(e.target.value, quoteValidity));
                    }
                  }}
                  className="input-base"
                />
              </div>

              {isDevis ? (
                <div>
                  <label className="mb-1.5 block text-[12.5px] font-semibold text-slate-600">
                    Valable jusqu&apos;au
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="input-base"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-[12.5px] font-semibold text-slate-600">
                    Date d&apos;échéance
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="input-base"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Lignes */}
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-[15px] font-semibold text-slate-900">Lignes de prestation</h2>
              <button
                onClick={addLine}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                <Plus className="size-3.5" /> Ajouter
              </button>
            </div>

            <div className="hidden gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:grid sm:grid-cols-[1fr_70px_110px_64px_90px_28px]">
              <span>Description</span>
              <span className="text-right">Qté</span>
              <span className="text-right">Prix unitaire</span>
              <span className="text-right">TVA</span>
              <span className="text-right">Total</span>
              <span />
            </div>

            <div className="divide-y divide-slate-100 sm:divide-y-0">
              {lines.map((line, index) => {
                const baseAmount = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
                const lineTotal = baseAmount * (1 + (Number(line.vatRate) || 0) / 100);
                return (
                  <div
                    key={line.key}
                    className="grid gap-2 px-5 py-3 sm:grid-cols-[1fr_70px_110px_64px_90px_28px] sm:items-center"
                  >
                    <input
                      value={line.description}
                      onChange={(e) => patchLine(line.key, { description: e.target.value })}
                      placeholder={`Prestation ${index + 1}`}
                      className="input-base py-2"
                      aria-label="Description"
                    />
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={line.quantity}
                      onChange={(e) => patchLine(line.key, { quantity: e.target.value })}
                      className="input-base py-2 text-right"
                      aria-label="Quantité"
                    />
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={line.unitPrice}
                      onChange={(e) => patchLine(line.key, { unitPrice: e.target.value })}
                      placeholder="0"
                      className="input-base py-2 text-right"
                      aria-label="Prix unitaire"
                    />
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={line.vatRate}
                        onChange={(e) => patchLine(line.key, { vatRate: e.target.value })}
                        className="input-base py-2 pl-2 pr-6 text-right"
                        aria-label="TVA"
                      />
                      <Percent className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-slate-400" />
                    </div>
                    <span className="text-right text-[12.5px] font-semibold text-slate-700">
                      {num(lineTotal)}
                    </span>
                    <button
                      onClick={() => removeLine(line.key)}
                      disabled={lines.length === 1}
                      className="grid size-7 place-items-center justify-self-end rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-30"
                      aria-label="Supprimer la ligne"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-[15px] font-semibold text-slate-900">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Conditions particulières, référence bon de commande…"
              className="input-base mt-3 resize-none"
            />
          </section>
        </div>

        {/* Récapitulatif */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-[15px] font-semibold text-slate-900">Récapitulatif</h2>
            </div>
            <dl className="space-y-2.5 px-5 py-4 text-[13px]">
              <div className="flex justify-between text-slate-600">
                <dt>Sous-total HT</dt>
                <dd className="font-semibold text-slate-800">{num(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt>TVA</dt>
                <dd className="font-semibold text-slate-800">{num(totals.vat)}</dd>
              </div>
              <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-slate-200 pt-3">
                <dt className="text-[13.5px] font-semibold text-slate-900">Total TTC</dt>
                <dd className="text-[20px] font-bold tracking-tight text-brand-700">
                  {num(totals.total)}{" "}
                  <span className="text-[11.5px] font-semibold text-slate-400">{currency}</span>
                </dd>
              </div>
            </dl>

            <div className="mx-5 mb-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[11.5px] leading-relaxed text-slate-500">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Le document est créé en <strong className="text-slate-700">brouillon</strong>. Vous pourrez
                l&apos;envoyer, l&apos;encaisser ou l&apos;exporter en PDF depuis sa fiche.
              </span>
            </div>

            <div className="border-t border-slate-100 p-4">
              <button
                onClick={submit}
                disabled={pending}
                className={clsx(
                  "btn-base w-full bg-brand-600 text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700",
                  pending && "opacity-60"
                )}
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {document ? "Enregistrer les modifications" : "Créer le document"}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
