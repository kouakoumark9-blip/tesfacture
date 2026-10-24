import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, Printer, Building2 } from "lucide-react";
import { getDocument, getClient, getSettings } from "@/lib/store";
import { docTotals, formatDate, isOverdue, money } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import DocumentActions from "@/components/DocumentActions";
import InvoicePaper from "@/components/InvoicePaper";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function FactureDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc || doc.type !== "facture") notFound();

  const client = getClient(doc.clientId);
  const settings = getSettings();
  const totals = docTotals(doc);
  const late = isOverdue(doc);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/factures"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="size-3.5" /> Toutes les factures
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-[26px] font-bold tracking-tight text-slate-900">{doc.number}</h1>
              <StatusBadge doc={doc} />
            </div>
            <p className="mt-1 text-[13.5px] text-slate-500">
              {client?.company || client?.name} · émise le {formatDate(doc.issueDate)} ·{" "}
              {money(totals.total, settings.currency)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <PrintButton />
            <DocumentActions doc={doc} />
          </div>
        </div>

        {late && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
            Cette facture est en retard de paiement (échéance dépassée depuis le{" "}
            {formatDate(doc.dueDate)}). Pensez à relancer votre client.
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_290px]">
        <div className="overflow-hidden rounded-2xl">
          <InvoicePaper doc={doc} client={client} settings={settings} />
        </div>

        <aside className="space-y-4 no-print lg:sticky lg:top-6 lg:self-start">
          <div className="card p-5">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-slate-400">
              Client
            </h2>
            <p className="mt-2 text-[14px] font-semibold text-slate-900">
              {client?.company || client?.name || "—"}
            </p>
            {client?.company && client?.name && (
              <p className="text-[12.5px] text-slate-500">{client.name}</p>
            )}
            <ul className="mt-3 space-y-1.5 text-[12.5px] text-slate-500">
              {client?.email && (
                <li className="flex items-center gap-2">
                  <Mail className="size-3.5 text-slate-400" /> {client.email}
                </li>
              )}
              {client?.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="size-3.5 text-slate-400" /> {client.phone}
                </li>
              )}
              {(client?.city || client?.address) && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                  {[client.address, client.city].filter(Boolean).join(", ")}
                </li>
              )}
              {client?.taxId && (
                <li className="flex items-center gap-2">
                  <Building2 className="size-3.5 text-slate-400" /> NCC {client.taxId}
                </li>
              )}
            </ul>
            {client && (
              <Link
                href={`/clients/${client.id}`}
                className="mt-3 inline-block text-[12.5px] font-semibold text-brand-600 hover:text-brand-700"
              >
                Voir la fiche client →
              </Link>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-slate-400">
              Détails
            </h2>
            <dl className="mt-3 space-y-2.5 text-[12.5px]">
              <Row label="Émission" value={formatDate(doc.issueDate)} />
              <Row label="Échéance" value={formatDate(doc.dueDate)} highlight={late} />
              <Row label="Total HT" value={money(totals.subtotal, settings.currency)} />
              <Row label="TVA" value={money(totals.vat, settings.currency)} />
              <Row label="Total TTC" value={money(totals.total, settings.currency)} strong />
              {doc.paidAt && <Row label="Encaissée le" value={formatDate(doc.paidAt)} />}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  highlight,
}: {
  label: string;
  value: string;
  strong?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={
          strong
            ? "text-[13px] font-bold text-slate-900"
            : highlight
              ? "font-semibold text-rose-600"
              : "font-medium text-slate-700"
        }
      >
        {value}
      </dd>
    </div>
  );
}
