import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Hourglass,
  AlertTriangle,
  FileSignature,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { listClients, listDocuments, getSettings } from "@/lib/store";
import { computeKpis, monthlySeries, topClients } from "@/lib/stats";
import { docTotals, formatDate, isOverdue, money, num, today } from "@/lib/format";
import { PageHeader, ButtonLink, SectionCard, Initials, EmptyState } from "@/components/ui";
import RevenueChart from "@/components/RevenueChart";
import { Badge, StatusBadge } from "@/components/StatusBadge";
import type { Document } from "@/lib/types";

export const dynamic = "force-dynamic";

function KpiCard({
  label,
  value,
  hint,
  icon,
  tone,
  trend,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  tone: "brand" | "amber" | "rose" | "emerald";
  trend?: number | null;
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <div className="card animate-rise p-5">
      <div className="flex items-start justify-between">
        <span className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span>
        {typeof trend === "number" && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11.5px] font-semibold ${
              trend >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {trend >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(trend)} %
          </span>
        )}
      </div>
      <p className="mt-4 text-[12.5px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-[22px] font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-[12px] text-slate-400">{hint}</p>
    </div>
  );
}

export default function DashboardPage() {
  const settings = getSettings();
  const docs = listDocuments();
  const clients = listClients();
  const currency = settings.currency;
  const kpis = computeKpis(docs);
  const series = monthlySeries(docs.filter((d) => d.type === "facture"), 6);
  const leaderboard = topClients(clients, docs, 4);

  const recent = docs.slice(0, 6);
  const toFollowUp = docs
    .filter(isOverdue)
    .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))
    .slice(0, 4);

  const clientName = (id: string) => {
    const c = clients.find((x) => x.id === id);
    return c?.company || c?.name || "Client supprimé";
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={formatDate(today())}
        title={`${greeting}, ${settings.company.name}`}
        subtitle="Voici la santé de votre activité de facturation."
        actions={
          <>
            <ButtonLink href="/devis/nouveau" variant="secondary">
              <FileSignature className="size-4" /> Nouveau devis
            </ButtonLink>
            <ButtonLink href="/factures/nouvelle">
              <Plus className="size-4" /> Nouvelle facture
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Chiffre d'affaires encaissé"
          value={money(kpis.revenue, currency)}
          hint={`${kpis.paidCount} facture${kpis.paidCount > 1 ? "s" : ""} réglée${kpis.paidCount > 1 ? "s" : ""}`}
          icon={<Wallet className="size-5" />}
          tone="brand"
          trend={kpis.growth}
        />
        <KpiCard
          label="En attente de règlement"
          value={money(kpis.outstanding, currency)}
          hint="Factures envoyées non échues"
          icon={<Hourglass className="size-5" />}
          tone="amber"
        />
        <KpiCard
          label="Impayés en retard"
          value={money(kpis.overdue, currency)}
          hint={`${kpis.overdueCount} facture${kpis.overdueCount > 1 ? "s" : ""} à relancer`}
          icon={<AlertTriangle className="size-5" />}
          tone="rose"
        />
        <KpiCard
          label="Devis en cours"
          value={money(kpis.quotesValue, currency)}
          hint={`${kpis.quotesOpen} proposition${kpis.quotesOpen > 1 ? "s" : ""} ouverte${kpis.quotesOpen > 1 ? "s" : ""}`}
          icon={<FileSignature className="size-5" />}
          tone="emerald"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" bodyClassName="px-0">
          <RevenueChart data={series} currency={currency} />
        </SectionCard>

        <SectionCard
          title="Meilleurs clients"
          subtitle="Par chiffre d'affaires encaissé"
          bodyClassName="divide-y divide-slate-100"
        >
          {leaderboard.length === 0 ? (
            <EmptyState title="Aucune donnée" description="Encaissez votre première facture pour voir apparaître vos meilleurs clients." />
          ) : (
            leaderboard.map((row) => (
              <Link
                key={row.client.id}
                href={`/clients/${row.client.id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50"
              >
                <Initials name={row.client.company || row.client.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-slate-800">
                    {row.client.company || row.client.name}
                  </p>
                  <p className="text-[11.5px] text-slate-500">
                    {row.count} facture{row.count > 1 ? "s" : ""}
                  </p>
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  {num(row.total)}
                </span>
              </Link>
            ))
          )}
        </SectionCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title="Derniers documents"
          subtitle="Factures et devis récents"
          action={
            <Link
              href="/factures"
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
            >
              Tout voir <ArrowRight className="size-3.5" />
            </Link>
          }
        >
          {recent.length === 0 ? (
            <EmptyState
              title="Aucun document"
              description="Créez votre première facture pour démarrer."
              action={<ButtonLink href="/factures/nouvelle">Nouvelle facture</ButtonLink>}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((doc) => (
                <li key={doc.id}>
                  <Link
                    href={`/${doc.type === "facture" ? "factures" : "devis"}/${doc.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-[10.5px] font-bold uppercase text-slate-500">
                      {doc.type === "facture" ? "FAC" : "DEV"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-slate-800">
                        {clientName(doc.clientId)}
                      </p>
                      <p className="text-[11.5px] text-slate-500">
                        {doc.number} · {formatDate(doc.issueDate)}
                      </p>
                    </div>
                    <span className="hidden text-[13px] font-semibold text-slate-700 sm:block">
                      {num(docTotals(doc).total)}
                    </span>
                    <StatusBadge doc={doc} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <div className="space-y-5">
          <SectionCard
            title="À relancer"
            subtitle="Factures échues"
            bodyClassName="divide-y divide-slate-100"
            action={
              toFollowUp.length > 0 ? <Badge tone="danger">{toFollowUp.length}</Badge> : undefined
            }
          >
            {toFollowUp.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-[13px] font-medium text-slate-600">Tout est à jour 🎉</p>
                <p className="mt-1 text-[12px] text-slate-400">Aucune facture en retard.</p>
              </div>
            ) : (
              toFollowUp.map((doc) => <FollowUpRow key={doc.id} doc={doc} name={clientName(doc.clientId)} />)
            )}
          </SectionCard>

          <div className="card overflow-hidden">
            <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                <TrendingUp className="size-4" /> Panier moyen
              </div>
              <p className="mt-2 text-[24px] font-bold">{money(kpis.averageBasket, currency)}</p>
              <p className="mt-1 text-[12px] text-brand-100">
                Sur {kpis.paidCount} facture{kpis.paidCount > 1 ? "s" : ""} encaissée
                {kpis.paidCount > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 text-[13px]">
              <span className="text-slate-500">Brouillons en attente</span>
              <span className="font-semibold text-slate-800">{kpis.draftCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FollowUpRow({ doc, name }: { doc: Document; name: string }) {
  return (
    <Link
      href={`/factures/${doc.id}`}
      className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-rose-50/40"
    >
      <span className="size-2 shrink-0 rounded-full bg-rose-500" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-slate-800">{name}</p>
        <p className="text-[11.5px] text-slate-500">Échéance {formatDate(doc.dueDate)}</p>
      </div>
      <span className="text-[12.5px] font-semibold text-rose-600">{num(docTotals(doc).total)}</span>
    </Link>
  );
}
