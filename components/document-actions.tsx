"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Download,
  FilePlus2,
  Link2,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  Send,
  Trash2,
  Truck,
  XCircle,
  Check,
} from "lucide-react";
import type { PreviewDoc } from "@/lib/preview";
import { documentMessage, mailtoUrl, publicLink, whatsappUrl } from "@/lib/share";
import {
  deleteDocumentAction,
  duplicateDocumentAction,
  invoiceToDeliveryAction,
  markDocumentSent,
  quoteToInvoiceAction,
  setDocumentStatus,
} from "@/lib/actions/documents";

export default function DocumentActions({
  doc,
  appUrl,
  watermark,
}: {
  doc: PreviewDoc;
  appUrl: string;
  watermark: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [created, setCreated] = useState<{ label: string; id: string } | null>(null);

  const link = publicLink(doc.shareToken, appUrl);
  const message = documentMessage(doc, link);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiez ce lien :", link);
    }
  }

  const run = (fn: () => Promise<{ ok: boolean; id?: string; error?: string }>) =>
    startTransition(async () => {
      const result = await fn();
      if (result.ok && result.id) router.push(`/app/documents/${result.id}`);
      router.refresh();
    });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <a
          href={`/api/documents/${doc.id}/pdf`}
          className="btn bg-brand-500 text-white hover:bg-brand-600"
        >
          <Download className="size-4" /> PDF
        </a>
        <a
          href={whatsappUrl(doc.client.phone, message)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn bg-[#25D366] text-white hover:bg-[#1eb958]"
        >
          <MessageCircle className="size-4" /> WhatsApp
        </a>
        <a
          href={mailtoUrl(
            doc.client.email,
            `${doc.type === "FAC" ? "Facture" : doc.type === "DEV" ? "Devis" : "Bon de livraison"} ${doc.number} — ${doc.company.name}`,
            message
          )}
          className="btn border border-black/10 bg-white text-slate-700 hover:bg-black/[0.03]"
        >
          <Mail className="size-4" /> E-mail
        </a>
        <button
          onClick={copyLink}
          className="btn border border-black/10 bg-white text-slate-700 hover:bg-black/[0.03]"
        >
          {copied ? <Check className="size-4 text-brand-600" /> : <Link2 className="size-4" />}
          {copied ? "Lien copié" : "Lien client"}
        </button>
      </div>

      <div className="rounded-xl bg-canvas px-3 py-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
          Lien public (lecture seule)
        </p>
        <p className="mt-0.5 break-all text-[12px] font-medium text-slate-600">{link}</p>
      </div>

      {watermark && (
        <a
          href="/app/abonnement"
          className="flex items-center justify-between rounded-xl border border-accent-200 bg-accent-50 px-3 py-2.5 text-[12.5px] font-semibold text-accent-800"
        >
          Le PDF porte la mention « Créé avec FactureCI ». Passer au Pro l&apos;enlève.
          <span aria-hidden>→</span>
        </a>
      )}

      <div className="grid gap-2">
        <a
          href={`/app/documents/${doc.id}/modifier`}
          className="btn border border-black/10 bg-white text-slate-700 hover:bg-black/[0.03]"
        >
          <Pencil className="size-4" /> Modifier
        </a>

        {doc.status === "draft" && (
          <button
            onClick={() => startTransition(async () => {
              await markDocumentSent(doc.id);
              router.refresh();
            })}
            disabled={pending}
            className="btn bg-slate-900 text-white hover:bg-slate-800"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Marquer comme envoyé
          </button>
        )}

        {doc.type === "DEV" && (
          <button
            onClick={() => run(() => quoteToInvoiceAction(doc.id))}
            disabled={pending}
            className="btn bg-accent-500 text-white hover:bg-accent-600"
          >
            <FilePlus2 className="size-4" /> Transformer en facture
          </button>
        )}

        {doc.type === "FAC" && (
          <button
            onClick={() => run(() => invoiceToDeliveryAction(doc.id))}
            disabled={pending}
            className="btn border border-black/10 bg-white text-slate-700 hover:bg-black/[0.03]"
          >
            <Truck className="size-4" /> Créer le bon de livraison
          </button>
        )}

        <button
          onClick={() => run(() => duplicateDocumentAction(doc.id))}
          disabled={pending}
          className="btn border border-black/10 bg-white text-slate-700 hover:bg-black/[0.03]"
        >
          <Copy className="size-4" /> Dupliquer
        </button>

        {doc.status !== "cancelled" && (
          <button
            onClick={() => startTransition(async () => {
              await setDocumentStatus(doc.id, "cancelled");
              router.refresh();
            })}
            disabled={pending}
            className="btn text-slate-500 hover:bg-black/[0.03]"
          >
            <XCircle className="size-4" /> Annuler le document
          </button>
        )}

        {confirmDelete ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2">
            <span className="flex-1 pl-1 text-[12.5px] font-semibold text-red-700">
              Supprimer définitivement ?
            </span>
            <button
              onClick={() => startTransition(() => deleteDocumentAction(doc.id))}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-bold text-white"
            >
              Oui
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg px-2 py-1.5 text-[12px] font-semibold text-red-700"
            >
              Non
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="btn text-red-600 hover:bg-red-50"
          >
            <Trash2 className="size-4" /> Supprimer
          </button>
        )}
      </div>

      {created && (
        <p className="text-[12.5px] text-brand-700">
          {created.label} créé.{" "}
          <a href={`/app/documents/${created.id}`} className="font-bold underline">
            Ouvrir
          </a>
        </p>
      )}
    </div>
  );
}
