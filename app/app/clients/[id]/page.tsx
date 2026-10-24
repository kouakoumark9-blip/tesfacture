import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { requireUser } from "@/lib/session";
import { listDocuments } from "@/lib/documents";
import { getDb } from "@/db/client";
import { clients as clientsTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { amount, dateShort } from "@/lib/format";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/preview";
import { Badge } from "@/components/ui";
import { whatsappUrl } from "@/lib/share";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const db = await getDb();
  const rows = await db
    .select()
    .from(clientsTable)
    .where(and(eq(clientsTable.id, id), eq(clientsTable.userId, user.id)))
    .limit(1);
  const client = rows[0];
  if (!client) notFound();

  const documents = (await listDocuments(user.id)).filter((row) => row.doc.clientId === id);
  const billed = documents.filter((r) => r.doc.type !== "BL").reduce((sum, r) => sum + r.total, 0);
  const paid = documents
    .filter((r) => r.doc.status === "paid")
    .reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/app/clients"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" /> Tous les clients
      </Link>

      <div className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-50 text-[14px] font-bold text-brand-700">
              {client.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-[19px] font-extrabold tracking-tight">{client.name}</h1>
              <p className="text-[12px] text-slate-500">Client depuis {dateShort(client.createdAt)}</p>
            </div>
          </div>
          {client.phone && (
            <a
              href={whatsappUrl(
                client.phone,
                `Bonjour ${client.name}, je vous contacte au sujet de nos documents.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn min-h-10 bg-[#25D366] px-3 text-[13px] text-white"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          )}
        </div>

        <ul className="mt-4 grid gap-2 border-t border-black/5 pt-3 text-[12.5px] text-slate-600 sm:grid-cols-2">
          {client.phone && (
            <li className="flex items-center gap-2">
              <Phone className="size-3.5 text-slate-400" /> {client.phone}
            </li>
          )}
          {client.email && (
            <li className="flex items-center gap-2">
              <Mail className="size-3.5 text-slate-400" /> {client.email}
            </li>
          )}
          {client.address && (
            <li className="flex items-start gap-2 sm:col-span-2">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400" /> {client.address}
            </li>
          )}
        </ul>

        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-black/5 pt-3 text-center">
          <div>
            <dt className="text-[11px] text-slate-500">Facturé</dt>
            <dd className="text-[14px] font-extrabold">{amount(billed)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-slate-500">Encaissé</dt>
            <dd className="text-[14px] font-extrabold text-brand-600">{amount(paid)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-slate-500">Documents</dt>
            <dd className="text-[14px] font-extrabold">{documents.length}</dd>
          </div>
        </dl>
      </div>

      <div className="flex gap-2">
        <Link
          href="/app/documents/nouveau?type=FAC"
          className="btn flex-1 bg-brand-500 text-white hover:bg-brand-600"
        >
          Nouvelle facture
        </Link>
        <Link
          href="/app/documents/nouveau?type=DEV"
          className="btn flex-1 border border-black/10 bg-white text-slate-700"
        >
          Nouveau devis
        </Link>
      </div>

      <section className="space-y-2">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-400">
          Historique
        </h2>
        {documents.length === 0 ? (
          <p className="card px-4 py-8 text-center text-[13px] text-slate-500">
            Aucun document pour ce client.
          </p>
        ) : (
          <ul className="space-y-2">
            {documents.map((row) => (
              <li key={row.doc.id}>
                <Link
                  href={`/app/documents/${row.doc.id}`}
                  className="card flex items-center gap-3 p-3 transition hover:border-brand-200"
                >
                  <span className="text-[11px] font-black text-slate-400">{row.doc.type}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold">{row.doc.number}</p>
                    <p className="text-[11.5px] text-slate-500">{dateShort(row.doc.issueDate)}</p>
                  </div>
                  {row.doc.type !== "BL" && (
                    <span className="text-[13px] font-bold">{amount(row.total)}</span>
                  )}
                  <Badge tone={STATUS_TONE[row.doc.status] ?? "neutral"}>
                    {STATUS_LABEL[row.doc.status] ?? row.doc.status}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
