import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getCompanyForUser, getDocumentForUser, listClients } from "@/lib/documents";
import { effectivePlan } from "@/lib/plan";
import DocumentWizard, { type WizardInitial } from "@/components/document-wizard";

export const metadata = { title: "Modifier le document — FactureCI" };
export const dynamic = "force-dynamic";

export default async function ModifierDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const bundle = await getDocumentForUser(id, user.id);
  if (!bundle) notFound();

  const [clients, company, plan] = await Promise.all([
    listClients(user.id),
    getCompanyForUser(user.id),
    effectivePlan(user.id),
  ]);

  const initial: WizardInitial = {
    id: bundle.doc.id,
    type: bundle.doc.type as "FAC" | "DEV" | "BL",
    number: bundle.doc.number,
    issueDate: bundle.doc.issueDate,
    dueDate: bundle.doc.dueDate ?? "",
    discountPercent: Number(bundle.doc.discountPercent),
    vatPercent: Number(bundle.doc.vatPercent),
    note: bundle.doc.note ?? "",
    paymentMethods: bundle.doc.paymentMethods ?? [],
    deliveryAddress: bundle.doc.deliveryAddress ?? "",
    deliveredBy: bundle.doc.deliveredBy ?? "",
    clientId: bundle.doc.clientId,
    clientName: bundle.client?.name ?? "",
    clientPhone: bundle.client?.phone ?? "",
    clientEmail: bundle.client?.email ?? "",
    clientAddress: bundle.client?.address ?? "",
    lines: bundle.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    })),
    installments: bundle.installments.map((item) => ({
      label: item.label,
      amount: Number(item.amount),
      dueDate: item.dueDate ?? "",
    })),
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/app/documents/${id}`}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" /> Retour au document
      </Link>
      <div className="mt-3">
        <DocumentWizard
          type={initial.type}
          initial={initial}
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
                  paymentNumbers: (company.paymentNumbers ?? {}) as Record<
                    string,
                    string | undefined
                  >,
                  defaultNote: company.defaultNote,
                }
              : null
          }
          showWatermark={plan === "free"}
          nextNumberPreview={initial.number}
        />
      </div>
    </div>
  );
}
