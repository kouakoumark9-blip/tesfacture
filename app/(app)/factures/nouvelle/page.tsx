import { getSettings, listClients, nextNumber } from "@/lib/store";
import DocumentEditor from "@/components/DocumentEditor";

export const dynamic = "force-dynamic";

export default function NouvelleFacturePage() {
  const settings = getSettings();
  const clients = listClients();

  return (
    <DocumentEditor
      type="facture"
      clients={clients}
      currency={settings.currency}
      defaultVatRate={settings.vatRate}
      paymentTerms={settings.paymentTerms}
      quoteValidity={settings.quoteValidity}
      nextNumberPreview={nextNumber("facture")}
    />
  );
}
