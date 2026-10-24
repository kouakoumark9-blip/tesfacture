import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, Building2 } from "lucide-react";
import { getDocument, getClient, getSettings } from "@/lib/store";
import { daysUntil, docTotals, formatDate, money } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import DocumentActions from "@/components/DocumentActions";
import InvoicePaper from "@/components/InvoicePaper";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function DevisDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc || doc.type !== "devis") notFound();

  const client = getClient(doc.clientId);
  const settings = getSettings();
  const totals = docTotals(doc);
  const remaining = daysUntil(doc.validUntil ?? doc.dueDate);
  const converts = Boolean(doc.convertedToId);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/devis"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="size-3.5" /> Tous les devis
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-[26px] font-bold tracking-tight text-slate-900">{doc.number}</h1>
              <StatusBadge doc={doc} />
            </div>
            <p className="mt-1 text-[13.5px] text-slate-500">
              {client?.company || client?.name} · émis le {formatDate(doc.issueDate)} ·{" "}
              {money(totals.total, settings.currency)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PrintButton />
            <DocumentActions doc={doc} />
          </div>
        </div>

        {doc.status === "envoye" && remaining >= 0 && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-[13px] font-medium text-sky-800">
            Devis en attente de réponse — encore valable {remaining} jour{remaining > 1 ? "s" : ""}.
          </div>
        )}
        {doc.status === "envoye" && remaining < 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-800">
            Ce devis a expiré depuis {Math.abs(remaining)} jour{Math.abs(remaining) > 1 ? "s" : ""}. Vous pouvez
            le dupliquer pour en prolonger la validité.
          </div>
        )}
        {converts && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-800">
            Devis converti en facture.{" "}
            <Link href={`/factures/${doc.convertedToId}`} className="font-bold underline">
              Ouvrir la facture
            </Link>
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
          </div>

          <div className="card p-5">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-slate-400">
              Détails
            </h2>
            <dl className="mt-3 space-y-2.5 text-[12.5px]">
              <DetailRow label="Émission" value={formatDate(doc.issueDate)} />
              <DetailRow label="Validité" value={formatDate(doc.validUntil)} />
              <DetailRow label="Total HT" value={money(totals.subtotal, settings.currency)} />
              <DetailRow label="TVA" value={money(totals.vat, settings.currency)} />
              <DetailRow label="Total TTC" value={money(totals.total, settings.currency)} strong />
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={strong ? "text-[13px] font-bold text-slate-900" : "font-medium text-slate-700"}>
        {value}
      </dd>
    </div>
  );
}
