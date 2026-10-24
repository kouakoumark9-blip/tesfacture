import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, Building2, Plus } from "lucide-react";
import { getClient, getSettings, listDocuments } from "@/lib/store";
import { clientStats } from "@/lib/stats";
import { docTotals, formatDate, money, num } from "@/lib/format";
import { Initials, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import ClientForm from "@/components/ClientForm";
import type { Document } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = getClient(id);
  if (!client) notFound();

  const settings = getSettings();
  const docs = listDocuments();
  const stats = clientStats(id, docs);

  return (
    <div className="space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-3.5" /> Retour aux clients
      </Link>

      <PageHeader
        title={client.company || client.name}
        subtitle={client.company ? client.name : "Fiche client"}
        actions={
          <>
            <Link href="/clients" className="btn-base border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
              Éditer plus tard
            </Link>
            <Link href="/factures/nouvelle" className="btn-base bg-brand-600 text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700">
              <Plus className="size-4" /> Facturer
            </Link>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-[15px] font-semibold text-slate-900">Historique</h2>
              <span className="text-[12px] text-slate-400">
                {stats.documents.length} document{stats.documents.length > 1 ? "s" : ""}
              </span>
            </div>
            {stats.documents.length === 0 ? (
              <p className="px-5 py-10 text-center text-[13px] text-slate-500">
                Aucun document pour ce client pour l&apos;instant.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {stats.documents.map((doc: Document) => (
                  <li key={doc.id}>
                    <Link
                      href={`/${doc.type === "facture" ? "factures" : "devis"}/${doc.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-[10px] font-bold text-slate-500">
                        {doc.type === "facture" ? "FAC" : "DEV"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-slate-800">{doc.number}</p>
                        <p className="text-[11.5px] text-slate-500">{formatDate(doc.issueDate)}</p>
                      </div>
                      <span className="text-[13px] font-semibold text-slate-800">
                        {num(docTotals(doc).total)}
                      </span>
                      <StatusBadge doc={doc} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-[15px] font-semibold text-slate-900">Modifier la fiche</h2>
            <ClientForm client={client} />
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <Initials name={client.company || client.name} className="size-12 text-[14px]" />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-slate-900">
                  {client.company || client.name}
                </p>
                <p className="text-[12px] text-slate-500">
                  Client depuis {formatDate(client.createdAt)}
                </p>
              </div>
            </div>

            <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-[12.5px] text-slate-600">
              {client.email && (
                <li className="flex items-center gap-2">
                  <Mail className="size-3.5 text-slate-400" />
                  <a href={`mailto:${client.email}`} className="truncate hover:text-brand-600">
                    {client.email}
                  </a>
                </li>
              )}
              {client.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="size-3.5 text-slate-400" />
                  <a href={`tel:${client.phone}`} className="hover:text-brand-600">
                    {client.phone}
                  </a>
                </li>
              )}
              {(client.address || client.city) && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                  <span>
                    {client.address}
                    {client.address && client.city ? <br /> : null}
                    {[client.city, client.country].filter(Boolean).join(", ")}
                  </span>
                </li>
              )}
              {client.taxId && (
                <li className="flex items-center gap-2">
                  <Building2 className="size-3.5 text-slate-400" /> NCC {client.taxId}
                </li>
              )}
            </ul>
          </div>

          <div className="card p-5">
            <h2 className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
              Synthèse financière
            </h2>
            <dl className="mt-3 space-y-3">
              <div>
                <dt className="text-[11.5px] text-slate-500">Total encaissé</dt>
                <dd className="text-[16px] font-bold text-emerald-600">
                  {money(stats.revenue, settings.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-[11.5px] text-slate-500">En attente</dt>
                <dd className="text-[15px] font-semibold text-amber-600">
                  {money(stats.outstanding, settings.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-[11.5px] text-slate-500">En retard</dt>
                <dd className="text-[15px] font-semibold text-rose-600">
                  {money(stats.due, settings.currency)}
                </dd>
              </div>
            </dl>
          </div>

          {client.notes && (
            <div className="card p-5">
              <h2 className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                Notes internes
              </h2>
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600">{client.notes}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
