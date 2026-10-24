import Link from "next/link";
import { Plus, ArrowUpRight, Mail, Phone } from "lucide-react";
import { listClients, listDocuments, getSettings } from "@/lib/store";
import { docTotals, money, num } from "@/lib/format";
import { clientStats } from "@/lib/stats";
import { ButtonLink, EmptyState, PageHeader, Initials } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function ClientsPage() {
  const clients = listClients();
  const docs = listDocuments();
  const currency = getSettings().currency;

  const rows = clients.map((c) => ({ client: c, stats: clientStats(c.id, docs) }));
  const totalRevenue = rows.reduce((s, r) => s + r.stats.revenue, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} client${clients.length > 1 ? "s" : ""} · ${money(totalRevenue, currency)} encaissés au total`}
        actions={
          <ButtonLink href="/clients/nouveau">
            <Plus className="size-4" /> Nouveau client
          </ButtonLink>
        }
      />

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Aucun client"
            description="Ajoutez votre premier client pour commencer à facturer."
            action={<ButtonLink href="/clients/nouveau">Créer un client</ButtonLink>}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ client, stats }) => {
            const open = stats.outstanding + stats.due;
            return (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60"
              >
                <div className="flex items-start justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <Initials name={client.company || client.name} className="size-11 text-[13px]" />
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold text-slate-900">
                        {client.company || client.name}
                      </p>
                      <p className="truncate text-[12px] text-slate-500">
                        {client.company ? client.name : client.city || "—"}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="size-4 text-slate-300 transition group-hover:text-brand-600" />
                </div>

                <ul className="mt-4 space-y-1 text-[12px] text-slate-500">
                  {client.email && (
                    <li className="flex items-center gap-1.5 truncate">
                      <Mail className="size-3.5 text-slate-400" /> {client.email}
                    </li>
                  )}
                  {client.phone && (
                    <li className="flex items-center gap-1.5">
                      <Phone className="size-3.5 text-slate-400" /> {client.phone}
                    </li>
                  )}
                </ul>

                <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-[11.5px]">
                  <div>
                    <dt className="text-slate-400">Encaissé</dt>
                    <dd className="mt-0.5 text-[13px] font-bold text-slate-900">
                      {num(stats.revenue)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">En cours</dt>
                    <dd className={`mt-0.5 text-[13px] font-bold ${open > 0 ? "text-amber-600" : "text-slate-400"}`}>
                      {num(open)}
                    </dd>
                  </div>
                </dl>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
