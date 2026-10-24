import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download, ShieldCheck } from "lucide-react";
import { getDocumentByToken } from "@/lib/documents";
import { DOC_TYPE_LABEL, STATUS_LABEL, STATUS_TONE, toPreview } from "@/lib/preview";
import { amount, dateShort } from "@/lib/format";
import { effectivePlan } from "@/lib/plan";
import DocumentPreview from "@/components/document-preview";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const bundle = await getDocumentByToken(token);
  if (!bundle) return { title: "Document introuvable — TesFacture" };
  return {
    title: `${DOC_TYPE_LABEL[bundle.doc.type as "FAC" | "DEV" | "BL"]} ${bundle.doc.number}`,
    description: `Document partagé par ${bundle.company?.name ?? "une entreprise"} via TesFacture.`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicDocumentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const bundle = await getDocumentByToken(token);
  if (!bundle) notFound();

  const plan = await effectivePlan(bundle.doc.userId);
  const doc = toPreview(bundle);

  return (
    <div className="min-h-dvh bg-canvas pb-16">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur no-print">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-500 text-[12px] font-black text-white">
              FC
            </span>
            <div>
              <p className="text-[13px] font-extrabold leading-tight">{doc.company.name}</p>
              <p className="text-[11px] text-slate-500">
                {DOC_TYPE_LABEL[doc.type]} {doc.number}
              </p>
            </div>
          </div>
          <Badge tone={STATUS_TONE[doc.status] ?? "neutral"}>
            {STATUS_LABEL[doc.status] ?? doc.status}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-3 pt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[15px] font-bold">
              {doc.type === "BL" ? "Bon de livraison" : `Montant : ${amount(doc.total)} FCFA`}
            </p>
            <p className="text-[12px] text-slate-500">
              Émis le {dateShort(doc.issueDate)}
              {doc.type !== "BL" && doc.dueDate ? ` · échéance ${dateShort(doc.dueDate)}` : ""}
            </p>
          </div>
          <a
            href={`/api/documents/${doc.id}/pdf?token=${doc.shareToken}`}
            className="btn bg-brand-500 px-4 text-white hover:bg-brand-600"
          >
            <Download className="size-4" /> Télécharger le PDF
          </a>
        </div>

        <div className="rounded-xl">
          <DocumentPreview doc={doc} showWatermark={plan === "free"} className="rounded-xl" />
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[11.5px] text-slate-400">
          <ShieldCheck className="size-3.5" />
          Document consultable en lecture seule · partagé avec TesFacture
        </p>
      </main>
    </div>
  );
}
