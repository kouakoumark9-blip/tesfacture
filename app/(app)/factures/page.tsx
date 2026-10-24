import { Plus } from "lucide-react";
import { getSettings, listByType, listClients } from "@/lib/store";
import { docTotals, isOverdue, money } from "@/lib/format";
import { ButtonLink, PageHeader } from "@/components/ui";
import DocumentTable from "@/components/DocumentTable";

export const dynamic = "force-dynamic";

export default function FacturesPage() {
  const settings = getSettings();
  const invoices = listByType("facture");
  const clients = listClients();

  const pending = invoices.filter((d) => d.status === "envoyee" && !isOverdue(d));
  const overdue = invoices.filter(isOverdue);

  const stats = [
    { label: "Total facturé", value: money(invoices.reduce((s, d) => s + docTotals(d).total, 0), settings.currency) },
    { label: "En attente", value: money(pending.reduce((s, d) => s + docTotals(d).total, 0), settings.currency) },
    { label: "En retard", value: money(overdue.reduce((s, d) => s + docTotals(d).total, 0), settings.currency) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Factures"
        subtitle={`${invoices.length} facture${invoices.length > 1 ? "s" : ""} émise${invoices.length > 1 ? "s" : ""} · exercice ${new Date().getFullYear()}`}
        actions={
          <ButtonLink href="/factures/nouvelle">
            <Plus className="size-4" /> Nouvelle facture
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

      <DocumentTable documents={invoices} clients={clients} type="facture" currency={settings.currency} />
    </div>
  );
}
