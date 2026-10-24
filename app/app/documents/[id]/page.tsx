import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getDocumentForUser } from "@/lib/documents";
import { effectivePlan } from "@/lib/plan";
import { toPreview, DOC_TYPE_LABEL, STATUS_LABEL, STATUS_TONE } from "@/lib/preview";
import { dateShort } from "@/lib/format";
import DocumentPreview from "@/components/document-preview";
import DocumentActions from "@/components/document-actions";
import InstallmentsPanel from "@/components/installments-panel";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nouveau?: string }>;
}) {
  const { id } = await params;
  const { nouveau } = await searchParams;
  const user = await requireUser();
  const bundle = await getDocumentForUser(id, user.id);
  if (!bundle) notFound();

  const plan = await effectivePlan(user.id);
  const doc = toPreview(bundle);
  const appUrl = process.env.APP_URL ?? "";
  const isNew = nouveau === "1";

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Link
        href={doc.type === "FAC" ? "/app/factures" : doc.type === "DEV" ? "/app/devis" : "/app/livraisons"}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-800 no-print"
      >
        <ArrowLeft className="size-4" /> Retour à la liste
      </Link>

      {isNew && (
        <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-3 text-[13.5px] font-semibold text-brand-800">
          <CheckCircle2 className="size-4" /> Document {doc.number} enregistré en brouillon.
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] font-extrabold tracking-tight">{doc.number}</h1>
            <Badge tone={STATUS_TONE[doc.status] ?? "neutral"}>
              {STATUS_LABEL[doc.status] ?? doc.status}
            </Badge>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-bold text-slate-600">
              {DOC_TYPE_LABEL[doc.type]}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-slate-600">
            {doc.client.name} · {dateShort(doc.issueDate)}
            {doc.type !== "BL" && doc.dueDate ? ` · échéance ${dateShort(doc.dueDate)}` : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="rounded-xl bg-canvas p-2 sm:p-3 no-print-padding">
            <DocumentPreview doc={doc} showWatermark={plan === "free"} className="rounded-lg" />
          </div>

          {doc.type === "FAC" && <InstallmentsPanel doc={doc} appUrl={appUrl} />}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-16 lg:self-start no-print">
          <DocumentActions doc={doc} appUrl={appUrl} watermark={plan === "free"} />

          <div className="card p-4">
            <h2 className="text-[12px] font-bold uppercase tracking-wide text-slate-400">
              Récapitulatif
            </h2>
            <dl className="mt-2 space-y-1.5 text-[12.5px]">
              {doc.type !== "BL" && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Sous-total</dt>
                    <dd className="font-semibold">{new Intl.NumberFormat("fr-FR").format(doc.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">
                      Remise {doc.discountPercent > 0 ? `(${doc.discountPercent} %)` : ""}
                    </dt>
                    <dd className="font-semibold">− {new Intl.NumberFormat("fr-FR").format(doc.discountAmount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">TVA {doc.vatPercent > 0 ? `(${doc.vatPercent} %)` : ""}</dt>
                    <dd className="font-semibold">{new Intl.NumberFormat("fr-FR").format(doc.vatAmount)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-black/5 pt-1.5">
                    <dt className="font-bold">Total</dt>
                    <dd className="font-extrabold text-brand-700">
                      {new Intl.NumberFormat("fr-FR").format(doc.total)} FCFA
                    </dd>
                  </div>
                </>
              )}
              <div className="flex justify-between pt-1.5">
                <dt className="text-slate-500">Créé le</dt>
                <dd className="font-medium">{dateShort(bundle.doc.createdAt)}</dd>
              </div>
            </dl>
          </div>

          <p className="flex items-start gap-1.5 px-1 text-[11px] text-slate-400">
            <Lock className="mt-0.5 size-3 shrink-0" />
            Ce document est privé. Seul le lien public permet au client de le consulter.
          </p>
        </aside>
      </div>
    </div>
  );
}
