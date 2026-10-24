import { notFound } from "next/navigation";
import { getDocument, getSettings, listClients } from "@/lib/store";
import DocumentEditor from "@/components/DocumentEditor";

export const dynamic = "force-dynamic";

export default async function ModifierDevisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc || doc.type !== "devis") notFound();

  const settings = getSettings();

  return (
    <DocumentEditor
      type="devis"
      clients={listClients()}
      currency={settings.currency}
      defaultVatRate={settings.vatRate}
      paymentTerms={settings.paymentTerms}
      quoteValidity={settings.quoteValidity}
      document={doc}
      nextNumberPreview={doc.number}
    />
  );
}
