"use client";

import Image from "next/image";
import { clsx } from "clsx";
import type { PreviewDoc } from "@/lib/preview";
import { DOC_TYPE_LABEL } from "@/lib/preview";
import { amountInWords } from "@/lib/money";
import { amount, dateShort } from "@/lib/format";

const LABELS = {
  prestataire: "Le prestataire",
  client: "Cachet et signature du client",
  livreur: "Le livreur",
  recu: "Reçu par (nom, date, signature)",
};

export default function DocumentPreview({
  doc,
  className,
  compact = false,
  showWatermark = false,
}: {
  doc: PreviewDoc;
  className?: string;
  compact?: boolean;
  showWatermark?: boolean;
}) {
  const isBL = doc.type === "BL";
  const title = DOC_TYPE_LABEL[doc.type].toUpperCase();

  return (
    <article
      className={clsx(
        "mx-auto w-full bg-white text-slate-900 shadow-[0_8px_30px_-12px_rgba(16,36,24,0.25)] ring-1 ring-black/[0.06]",
        compact ? "max-w-none p-4 text-[11px]" : "max-w-[210mm] p-6 text-[12.5px] sm:p-9",
        "print:max-w-none print:p-0 print:shadow-none print:ring-0",
        className
      )}
      aria-label={`Aperçu ${title} ${doc.number}`}
    >
      {/* En-tête */}
      <header className="flex items-start justify-between gap-4 border-b-2 border-brand-500 pb-4">
        <div className="flex min-w-0 items-start gap-3">
          {doc.company.logo ? (
            <Image
              src={doc.company.logo}
              alt=""
              width={compact ? 40 : 56}
              height={compact ? 40 : 56}
              unoptimized
              className={clsx("shrink-0 rounded object-contain", compact ? "size-10" : "size-14")}
            />
          ) : (
            <span
              className={clsx(
                "grid shrink-0 place-items-center rounded bg-brand-500 font-black text-white",
                compact ? "size-10 text-[11px]" : "size-14 text-[15px]"
              )}
            >
              {doc.company.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className={clsx("font-bold uppercase leading-tight", compact ? "text-[12px]" : "text-[15px]")}>
              {doc.company.name}
            </p>
            <p className="mt-0.5 whitespace-pre-line leading-snug text-slate-500">
              {doc.company.address}
              {doc.company.phone ? `\n${doc.company.phone}` : ""}
              {doc.company.rccm ? `\nRCCM : ${doc.company.rccm}` : ""}
              {doc.company.taxNumber ? `\nCC : ${doc.company.taxNumber}` : ""}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className={clsx("font-black tracking-tight text-brand-600", compact ? "text-[15px]" : "text-[22px]")}>
            {title}
          </p>
          <p className="font-semibold text-slate-700">{doc.number}</p>
          <p className="mt-1 text-slate-500">Date : {dateShort(doc.issueDate)}</p>
          {!isBL && doc.dueDate && (
            <p className="text-slate-500">Échéance : {dateShort(doc.dueDate)}</p>
          )}
        </div>
      </header>

      {/* Client */}
      <section className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {isBL ? "Livré à" : "Facturé à"}
          </p>
          <p className="mt-1 font-bold">{doc.client.name}</p>
          <p className="whitespace-pre-line text-slate-500">
            {(isBL ? doc.deliveryAddress : doc.client.address) || ""}
            {doc.client.phone ? `\n${doc.client.phone}` : ""}
            {doc.client.email ? `\n${doc.client.email}` : ""}
          </p>
        </div>
      </section>

      {/* Lignes */}
      <table className="mt-4 w-full text-left">
        <thead>
          <tr className="border-y border-slate-200 bg-brand-50/70 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            <th className="px-2 py-2">Désignation</th>
            <th className="px-2 py-2 text-right">Qté</th>
            {!isBL && <th className="px-2 py-2 text-right">Prix unitaire</th>}
            {!isBL && <th className="px-2 py-2 text-right">Montant</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {doc.items.map((item, index) => (
            <tr key={`${item.description}-${index}`}>
              <td className="px-2 py-2 font-medium">{item.description}</td>
              <td className="px-2 py-2 text-right text-slate-600">{item.quantity}</td>
              {!isBL && (
                <td className="px-2 py-2 text-right text-slate-600">{amount(item.unitPrice)}</td>
              )}
              {!isBL && (
                <td className="px-2 py-2 text-right font-semibold">{amount(item.total)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {!isBL && (
        <>
          {/* Totaux */}
          <section className="mt-4 flex flex-col gap-4 sm:flex-row sm:justify-between">
            <div className="max-w-sm">
              <p className="text-[11px] font-semibold leading-relaxed text-slate-600">
                {amountInWords(doc.total)}
              </p>
              {doc.note && (
                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Note
                  </p>
                  <p className="whitespace-pre-line text-slate-600">{doc.note}</p>
                </div>
              )}
            </div>

            <dl className="w-full max-w-[240px] shrink-0 space-y-1 self-start">
              <Row label="Sous-total" value={amount(doc.subtotal)} />
              {doc.discountPercent > 0 && (
                <Row
                  label={`Remise (${doc.discountPercent} %)`}
                  value={`− ${amount(doc.discountAmount)}`}
                />
              )}
              <Row
                label={doc.vatPercent > 0 ? `TVA (${doc.vatPercent} %)` : "TVA (non applicable)"}
                value={amount(doc.vatAmount)}
              />
              <div className="mt-1 flex items-baseline justify-between rounded bg-brand-500 px-3 py-2 text-white">
                <dt className="text-[11px] font-bold uppercase tracking-wide">Total</dt>
                <dd className="font-bold">
                  {amount(doc.total)} <span className="text-[10px] font-semibold">FCFA</span>
                </dd>
              </div>
            </dl>
          </section>

          {/* Tranches */}
          {doc.installments.length > 1 && (
            <section className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Échéancier de paiement
              </p>
              <table className="mt-1.5 w-full text-left">
                <tbody className="divide-y divide-slate-100">
                  {doc.installments.map((item) => (
                    <tr key={item.id}>
                      <td className="py-1.5 font-medium">{item.label}</td>
                      <td className="py-1.5 text-slate-500">
                        {item.dueDate ? dateShort(item.dueDate) : ""}
                      </td>
                      <td className="py-1.5 text-right font-semibold">{amount(item.amount)}</td>
                      <td className="py-1.5 pl-3 text-right text-[10.5px] font-semibold">
                        {item.paidAt ? (
                          <span className="text-brand-600">Payé</span>
                        ) : (
                          <span className="text-slate-400">À payer</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Moyens de paiement */}
          {doc.paymentMethods.length > 0 && (
            <section className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Moyens de paiement
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {doc.paymentMethods.map((method) => {
                  const key = numberKey(method);
                  const number = key ? doc.company.paymentNumbers[key] : undefined;
                  return (
                    <li
                      key={method}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10.5px] font-semibold text-slate-700"
                    >
                      {method}
                      {number ? <span className="ml-1 font-normal text-slate-500">· {number}</span> : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}

      {/* Signatures */}
      <section className="mt-6 grid grid-cols-2 gap-6">
        <SignatureBox
          label={isBL ? LABELS.livreur : LABELS.prestataire}
          name={isBL ? doc.deliveredBy ?? "" : doc.company.name}
        />
        <SignatureBox label={isBL ? LABELS.recu : LABELS.client} />
      </section>

      {showWatermark && (
        <p className="mt-5 border-t border-slate-100 pt-2 text-center text-[9.5px] font-semibold uppercase tracking-wider text-slate-400">
          Créé avec FactureCI
        </p>
      )}
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-slate-600">
      <dt>{label}</dt>
      <dd className="font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

function SignatureBox({ label, name }: { label: string; name?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      {name && <p className="mt-0.5 text-[11px] font-medium text-slate-600">{name}</p>}
      <div className="mt-1 h-14 rounded border border-dashed border-slate-300" />
    </div>
  );
}

export function numberKey(method: string): string | null {
  switch (method) {
    case "Wave":
      return "wave";
    case "Orange Money":
      return "orange";
    case "MTN Money":
      return "mtn";
    case "Moov Money":
      return "moov";
    default:
      return null;
  }
}
