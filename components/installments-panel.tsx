"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, MessageCircle, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import type { PreviewDoc } from "@/lib/preview";
import { amount, dateShort, todayISO } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/calc";
import { paymentConfirmationMessage, reminderMessage, smsUrl, whatsappUrl } from "@/lib/share";
import { toggleInstallmentPaid } from "@/lib/actions/documents";

export default function InstallmentsPanel({
  doc,
  appUrl,
}: {
  doc: PreviewDoc;
  appUrl: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [method, setMethod] = useState<string>("Wave");

  if (doc.installments.length === 0) return null;

  const paidTotal = doc.installments
    .filter((item) => item.paidAt)
    .reduce((sum, item) => sum + item.amount, 0);
  const remaining = doc.total - paidTotal;

  const toggle = (id: string, paid: boolean) =>
    startTransition(async () => {
      await toggleInstallmentPaid(id, paid, method);
      setOpenFor(null);
      router.refresh();
    });

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-black/5 px-4 py-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[14px] font-bold">Paiement en tranches</h2>
          <span className="text-[12px] font-semibold text-slate-500">
            {amount(paidTotal)} / {amount(doc.total)} FCFA
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${doc.total ? Math.min(100, (paidTotal / doc.total) * 100) : 0}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11.5px] text-slate-500">
          Reste {amount(remaining)} FCFA à encaisser
        </p>
      </div>

      <ul className="divide-y divide-black/5">
        {doc.installments.map((item) => {
          const late = !item.paidAt && item.dueDate && item.dueDate < todayISO();
          return (
            <li key={item.id} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "grid size-7 shrink-0 place-items-center rounded-full",
                    item.paidAt
                      ? "bg-brand-500 text-white"
                      : late
                        ? "bg-red-100 text-red-600"
                        : "bg-slate-100 text-slate-400"
                  )}
                >
                  {item.paidAt ? <Check className="size-4" /> : <span className="text-[10px] font-bold">•</span>}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold">{item.label}</p>
                  <p className="text-[11.5px] text-slate-500">
                    {item.paidAt
                      ? `Payé le ${dateShort(item.paidAt)}${item.method ? ` · ${item.method}` : ""}`
                      : item.dueDate
                        ? `Échéance ${dateShort(item.dueDate)}${late ? " · en retard" : ""}`
                        : "Sans échéance"}
                  </p>
                </div>

                <span className="shrink-0 text-[13px] font-extrabold">{amount(item.amount)}</span>

                {item.paidAt ? (
                  <button
                    onClick={() => toggle(item.id, false)}
                    disabled={pending}
                    className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
                    aria-label={`Annuler le paiement de ${item.label}`}
                    title="Annuler le paiement"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setOpenFor(openFor === item.id ? null : item.id)}
                    className="btn min-h-8 shrink-0 bg-brand-500 px-2.5 text-[12px] text-white hover:bg-brand-600"
                  >
                    Payé ?
                  </button>
                )}
              </div>

              {openFor === item.id && (
                <div className="mt-2 rounded-xl bg-canvas p-2.5">
                  <p className="text-[11.5px] font-semibold text-slate-600">Moyen de paiement</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {PAYMENT_METHODS.map((option) => (
                      <button
                        key={option}
                        onClick={() => setMethod(option)}
                        className={clsx(
                          "rounded-full border px-2.5 py-1 text-[11.5px] font-semibold",
                          method === option
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-black/10 bg-white text-slate-600"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => toggle(item.id, true)}
                      disabled={pending}
                      className="btn min-h-10 flex-1 bg-brand-500 text-[13px] text-white"
                    >
                      {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                      Confirmer le paiement
                    </button>
                    <a
                      href={whatsappUrl(
                        doc.client.phone,
                        paymentConfirmationMessage({
                          clientName: doc.client.name,
                          companyName: doc.company.name,
                          documentNumber: doc.number,
                          amount: item.amount,
                          method,
                        })
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn min-h-10 bg-[#25D366] px-3 text-[13px] text-white"
                      title="Envoyer la confirmation sur WhatsApp"
                    >
                      <MessageCircle className="size-4" />
                    </a>
                  </div>
                </div>
              )}

              {!item.paidAt && doc.type === "FAC" && (
                <div className="mt-2 flex flex-wrap gap-1.5 pl-9">
                  <a
                    href={whatsappUrl(
                      doc.client.phone,
                      reminderMessage({
                        clientName: doc.client.name,
                        companyName: doc.company.name,
                        documentNumber: doc.number,
                        installmentLabel: item.label,
                        amount: item.amount,
                        dueDate: item.dueDate,
                        paymentMethods: doc.paymentMethods,
                        paymentNumbers: doc.company.paymentNumbers,
                        appUrl,
                        shareToken: doc.shareToken,
                      })
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-[#25D366]/10 px-2.5 py-1 text-[11.5px] font-bold text-[#0e8a45]"
                  >
                    <MessageCircle className="size-3.5" /> Relancer sur WhatsApp
                  </a>
                  <a
                    href={smsUrl(
                      doc.client.phone,
                      reminderMessage({
                        clientName: doc.client.name,
                        companyName: doc.company.name,
                        documentNumber: doc.number,
                        installmentLabel: item.label,
                        amount: item.amount,
                        dueDate: item.dueDate,
                        paymentMethods: doc.paymentMethods,
                        paymentNumbers: doc.company.paymentNumbers,
                        appUrl,
                        shareToken: doc.shareToken,
                      })
                    )}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-bold text-slate-600"
                  >
                    SMS
                  </a>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
