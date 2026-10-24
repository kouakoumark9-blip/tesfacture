import { Plus } from "lucide-react";
import { getSettings, listByType, listClients } from "@/lib/store";
import { docTotals, money } from "@/lib/format";
import { ButtonLink, PageHeader } from "@/components/ui";
import DocumentTable from "@/components/DocumentTable";

export const dynamic = "force-dynamic";

export default function DevisPage() {
  const settings = getSettings();
  const quotes = listByType("devis");
  const clients = listClients();

  const open = quotes.filter((d) => d.status === "brouillon" || d.status === "envoye");
  const accepted = quotes.filter((d) => d.status === "accepte");
  const refused = quotes.filter((d) => d.status === "refuse");

  const sum = (list: typeof quotes) => money(list.reduce((s, d) => s + docTotals(d).total, 0), settings.currency);

  const stats = [
    { label: "Devis en cours", value: sum(open) },
    { label: "Acceptés", value: sum(accepted) },
    { label: "Refusés", value: sum(refused) },
  ];

  const conversion =
    accepted.length + refused.length > 0
      ? Math.round((accepted.length / (accepted.length + refused.length)) * 100)
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devis"
        subtitle={
          conversion === null
            ? `${quotes.length} devis · aucun retour client enregistré`
            : `${quotes.length} devis · taux de conversion ${conversion} %`
        }
        actions={
          <ButtonLink href="/devis/nouveau">
            <Plus className="size-4" /> Nouveau devis
          </ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card px-5 py-4">
            <p className="text-[12px] font-medium text-slate-500">{s.label}</p>
            <p className="mt-1 text-[19px] font-bold tracking-tight text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <DocumentTable documents={quotes} clients={clients} type="devis" currency={settings.currency} />
    </div>
  );
}
