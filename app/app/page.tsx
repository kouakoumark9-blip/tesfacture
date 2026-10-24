import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Clock,
  FileSignature,
  FileText,
  Plus,
  Receipt,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import { requireUser } from "@/lib/session";
import { loadDashboard } from "@/lib/dashboard";
import { resolvePeriod } from "@/lib/period";
import { amount, dateShort } from "@/lib/format";
import { DOC_TYPE_LABEL, STATUS_LABEL, STATUS_TONE } from "@/lib/preview";
import PeriodFilter from "@/components/period-filter";
import ReminderLink from "@/components/reminder-link";
import { MonthlyBars, PaymentDonut } from "@/components/dashboard-charts";
import { Badge, EmptyState } from "@/components/ui";

export const metadata = { title: "Tableau de bord — TesFacture" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const user = await requireUser();
  const { period: periodKey, from, to } = await searchParams;
  const period = resolvePeriod(periodKey, from, to);
  const data = await loadDashboard(user.id, period);
  const appUrl = process.env.APP_URL ?? "";

  const kpis = [
    {
      label: "Facturé",
      value: data.metrics.billed,
      icon: Receipt,
      tone: "bg-brand-50 text-brand-600",
      hint: `${data.metrics.documentsCount} document${data.metrics.documentsCount > 1 ? "s" : ""} sur la période`,
    },
    {
      label: "Encaissé",
      value: data.metrics.collected,
      icon: Wallet,
      tone: "bg-brand-500 text-white",
      hint: "Tranches réglées sur la période",
    },
    {
      label: "À encaisser",
      value: data.metrics.toCollect,
      icon: Banknote,
      tone: "bg-accent-50 text-accent-600",
      hint: "Restant dû des factures de la période",
    },
    {
      label: "En retard",
      value: data.metrics.overdueAmount,
      icon: AlertTriangle,
      tone: "bg-red-50 text-red-600",
      hint: `${data.metrics.overdueCount} facture${data.metrics.overdueCount > 1 ? "s" : ""} en retard`,
    },
  ];

  const isEmpty = data.metrics.documentsCount === 0 && data.recent.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight">
            Bonjour {user.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-600">
            Période : {period.label.toLowerCase()} · {dateShort(period.start)} → {dateShort(period.end)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/documents/nouveau?type=FAC"
            className="btn min-h-11 bg-brand-500 px-3.5 text-[13.5px] text-white hover:bg-brand-600"
          >
            <Plus className="size-4" /> Facture
          </Link>
          <Link
            href="/app/documents/nouveau?type=DEV"
            className="btn min-h-11 border border-black/10 bg-white px-3.5 text-[13.5px] text-slate-700"
          >
            <Plus className="size-4" /> Devis
          </Link>
          <Link
            href="/app/documents/nouveau?type=BL"
            className="btn min-h-11 border border-black/10 bg-white px-3.5 text-[13.5px] text-slate-700"
          >
            <Plus className="size-4" /> Bon de livraison
          </Link>
        </div>
      </div>

      <PeriodFilter value={period.key} />

      {isEmpty ? (
        <div className="card">
          <EmptyState
            icon={<FileText className="size-5" />}
            title="Commencez à facturer"
            description="Créez votre première facture : 3 étapes, PDF et envoi WhatsApp inclus."
            action={
              <Link
                href="/app/documents/nouveau?type=FAC"
                className="btn w-full bg-brand-500 text-white hover:bg-brand-600"
              >
                Créer ma première facture
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* Indicateurs */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="card p-4">
                <div className="flex items-start justify-between">
                  <span className={`grid size-9 place-items-center rounded-xl ${kpi.tone}`}>
                    <kpi.icon className="size-[18px]" />
                  </span>
                </div>
                <p className="mt-3 text-[12px] font-medium text-slate-500">{kpi.label}</p>
                <p className="text-[19px] font-extrabold tracking-tight">
                  {amount(kpi.value)}
                  <span className="ml-1 text-[11px] font-semibold text-slate-400">FCFA</span>
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">{kpi.hint}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="card flex items-center gap-3 p-4">
              <span className="grid size-9 place-items-center rounded-xl bg-accent-50 text-accent-600">
                <FileSignature className="size-[18px]" />
              </span>
              <div>
                <p className="text-[12px] text-slate-500">Devis en attente</p>
                <p className="text-[16px] font-extrabold">{data.metrics.quotesPending}</p>
              </div>
            </div>
            <div className="card flex items-center gap-3 p-4">
              <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <TrendingUp className="size-[18px]" />
              </span>
              <div>
                <p className="text-[12px] text-slate-500">Conversion devis → facture</p>
                <p className="text-[16px] font-extrabold">
                  {data.conversion === null ? "—" : `${data.conversion} %`}
                </p>
              </div>
            </div>
            <div className="card flex items-center gap-3 p-4">
              <span className="grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-600">
                <Truck className="size-[18px]" />
              </span>
              <div>
                <p className="text-[12px] text-slate-500">Bons de livraison</p>
                <p className="text-[16px] font-extrabold">{data.metrics.deliveryNotes}</p>
              </div>
            </div>
          </div>

          {/* Graphiques */}
          <div className="grid gap-3 lg:grid-cols-5">
            <section className="card p-4 lg:col-span-3">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[14px] font-bold">Facturé et encaissé — 12 mois</h2>
                <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-sm bg-[#CFE3D8]" /> Facturé
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-sm bg-brand-500" /> Encaissé
                  </span>
                </div>
              </div>
              <MonthlyBars data={data.months} />
            </section>

            <section className="card p-4 lg:col-span-2">
              <h2 className="mb-2 text-[14px] font-bold">Encaissé par moyen de paiement</h2>
              <PaymentDonut data={data.payments} />
            </section>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {/* Meilleurs clients */}
            <section className="card overflow-hidden">
              <div className="border-b border-black/5 px-4 py-3">
                <h2 className="text-[14px] font-bold">Meilleurs clients</h2>
                <p className="text-[11.5px] text-slate-500">Par montant facturé sur la période</p>
              </div>
              {data.topClients.length === 0 ? (
                <p className="px-4 py-8 text-center text-[12.5px] text-slate-500">
                  Aucune facture sur la période.
                </p>
              ) : (
                <ul className="divide-y divide-black/5">
                  {data.topClients.map((row, index) => (
                    <li key={row.clientId} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold">{row.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {row.documents} facture{row.documents > 1 ? "s" : ""}
                        </p>
                      </div>
                      <span className="text-[13px] font-extrabold">{amount(row.billed)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* À encaisser cette semaine */}
            <section className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
                <div>
                  <h2 className="text-[14px] font-bold">À encaisser cette semaine</h2>
                  <p className="text-[11.5px] text-slate-500">Échéances des 7 prochains jours</p>
                </div>
                <Clock className="size-4 text-slate-300" />
              </div>
              {data.upcoming.length === 0 ? (
                <p className="px-4 py-8 text-center text-[12.5px] text-slate-500">
                  Aucune échéance cette semaine.
                </p>
              ) : (
                <ul className="divide-y divide-black/5">
                  {data.upcoming.map((row) => (
                    <li key={row.installmentId} className="flex items-center gap-2 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/app/documents/${row.documentId}`}
                          className="truncate text-[13px] font-semibold hover:text-brand-700"
                        >
                          {row.clientName}
                        </Link>
                        <p className="text-[11px] text-slate-400">
                          {row.documentNumber} · {dateShort(row.dueDate)}
                        </p>
                      </div>
                      <span className="text-[12.5px] font-bold">{amount(row.amount)}</span>
                      <ReminderLink
                        compact
                        clientName={row.clientName}
                        clientPhone={row.clientPhone}
                        companyName={data.companyName || "TesFacture"}
                        documentNumber={row.documentNumber}
                        installmentLabel={row.label}
                        amount={row.amount}
                        dueDate={row.dueDate}
                        paymentMethods={row.paymentMethods}
                        paymentNumbers={data.paymentNumbers}
                        appUrl={appUrl}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Factures en retard */}
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
              <div>
                <h2 className="text-[14px] font-bold">Factures en retard</h2>
                <p className="text-[11.5px] text-slate-500">Les plus anciennes d&apos;abord</p>
              </div>
              <Badge tone={data.overdue.length > 0 ? "danger" : "success"}>
                {data.metrics.overdueCount} facture{data.metrics.overdueCount > 1 ? "s" : ""}
              </Badge>
            </div>
            {data.overdue.length === 0 ? (
              <p className="px-4 py-8 text-center text-[12.5px] text-slate-500">
                Aucune facture en retard ✅
              </p>
            ) : (
              <ul className="divide-y divide-black/5">
                {data.overdue.map((row) => (
                  <li key={row.installmentId} className="flex items-center gap-2 px-4 py-2.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-red-50 text-red-600">
                      <AlertTriangle className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/app/documents/${row.documentId}`}
                        className="truncate text-[13px] font-semibold hover:text-brand-700"
                      >
                        {row.clientName}
                      </Link>
                      <p className="text-[11px] text-slate-400">
                        {row.documentNumber} · {row.daysLate} jour{row.daysLate > 1 ? "s" : ""} de retard
                      </p>
                    </div>
                    <span className="text-[12.5px] font-bold text-red-600">
                      {amount(row.amount)}
                    </span>
                    <ReminderLink
                      compact
                      clientName={row.clientName}
                      clientPhone={row.clientPhone}
                      companyName={data.companyName || "TesFacture"}
                      documentNumber={row.documentNumber}
                      installmentLabel={row.label}
                      amount={row.amount}
                      dueDate={row.dueDate}
                      paymentMethods={row.paymentMethods}
                      paymentNumbers={data.paymentNumbers}
                      appUrl={appUrl}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Derniers documents + export */}
          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 px-4 py-3">
              <h2 className="text-[14px] font-bold">Derniers documents</h2>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/export?kind=documents&period=${period.key}&from=${period.start}&to=${period.end}`}
                  className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-600 hover:bg-black/[0.03]"
                >
                  Export documents (CSV)
                </a>
                <a
                  href={`/api/export?kind=payments&period=${period.key}&from=${period.start}&to=${period.end}`}
                  className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-600 hover:bg-black/[0.03]"
                >
                  Export paiements (CSV)
                </a>
              </div>
            </div>
            <ul className="divide-y divide-black/5">
              {data.recent.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/app/documents/${row.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-black/[0.015]"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-[9.5px] font-black text-slate-500">
                      {row.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">{row.number}</p>
                      <p className="truncate text-[11px] text-slate-400">
                        {row.clientName} · {dateShort(row.issueDate)} ·{" "}
                        {DOC_TYPE_LABEL[row.type as "FAC" | "DEV" | "BL"]}
                      </p>
                    </div>
                    {row.type !== "BL" && (
                      <span className="text-[12.5px] font-bold">{amount(row.total)}</span>
                    )}
                    <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>
                      {STATUS_LABEL[row.status] ?? row.status}
                    </Badge>
                    <ArrowRight className="size-4 shrink-0 text-slate-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
