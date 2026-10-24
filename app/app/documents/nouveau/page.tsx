import Link from "next/link";
import { ArrowLeft, ArrowRight, FileSignature, FileText, Truck } from "lucide-react";
import { requireUser } from "@/lib/session";
import { listClients, getCompanyForUser, peekNumber } from "@/lib/documents";
import { effectivePlan } from "@/lib/plan";
import DocumentWizard from "@/components/document-wizard";
import { todayISO } from "@/lib/format";

export const metadata = { title: "Nouveau document — FactureCI" };
export const dynamic = "force-dynamic";

const TYPES = [
  {
    type: "FAC" as const,
    title: "Facture",
    description: "Demander un paiement, avec TVA et tranches.",
    icon: FileText,
    color: "bg-brand-50 text-brand-600 border-brand-200",
  },
  {
    type: "DEV" as const,
    title: "Devis",
    description: "Proposer un prix avant de commencer.",
    icon: FileSignature,
    color: "bg-accent-50 text-accent-600 border-accent-200",
  },
  {
    type: "BL" as const,
    title: "Bon de livraison",
    description: "Confirmer une livraison, sans montant.",
    icon: Truck,
    color: "bg-sky-50 text-sky-600 border-sky-200",
  },
];

export default async function NouveauDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await requireUser();
  const { type: rawType } = await searchParams;
  const type = rawType === "FAC" || rawType === "DEV" || rawType === "BL" ? rawType : null;

  if (!type) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href="/app/documents"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="size-4" /> Mes documents
        </Link>
        <h1 className="mt-3 text-[24px] font-extrabold tracking-tight">
          Que voulez-vous créer ?
        </h1>
        <p className="mt-1 text-[13.5px] text-slate-600">
          Trois étapes, moins de deux minutes.
        </p>

        <div className="mt-5 space-y-2.5">
          {TYPES.map((item) => (
            <Link
              key={item.type}
              href={`/app/documents/nouveau?type=${item.type}`}
              className={`card flex items-center gap-3.5 border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${item.color}`}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/70">
                <item.icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-slate-900">{item.title}</span>
                <span className="block text-[12.5px] text-slate-600">{item.description}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-slate-400" />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const [clients, company, plan, preview] = await Promise.all([
    listClients(user.id),
    getCompanyForUser(user.id),
    effectivePlan(user.id),
    peekNumber(user.id, type, Number(todayISO().slice(0, 4))),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <DocumentWizard
        type={type}
        clients={clients.map((client) => ({
          id: client.id,
          name: client.name,
          phone: client.phone,
          email: client.email,
          address: client.address,
        }))}
        company={
          company
            ? {
                name: company.name ?? "",
                logo: company.logo,
                rccm: company.rccm,
                taxNumber: company.taxNumber,
                address: company.address,
                phone: company.phone,
                paymentNumbers: (company.paymentNumbers ?? {}) as Record<string, string | undefined>,
                defaultNote: company.defaultNote,
              }
            : null
        }
        showWatermark={plan === "free"}
        nextNumberPreview={preview}
      />
    </div>
  );
}
