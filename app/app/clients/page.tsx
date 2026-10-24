import Link from "next/link";
import { ChevronRight, Phone, Search, Users } from "lucide-react";
import { requireUser } from "@/lib/session";
import { listClients, listDocuments } from "@/lib/documents";
import { amount } from "@/lib/format";
import { Badge, EmptyState } from "@/components/ui";

export const metadata = { title: "Clients — TesFacture" };
export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();

  const [clients, documents] = await Promise.all([
    listClients(user.id),
    listDocuments(user.id),
  ]);

  const rows = clients
    .filter(
      (client) =>
        !query ||
        client.name.toLowerCase().includes(query) ||
        (client.phone ?? "").toLowerCase().includes(query)
    )
    .map((client) => {
      const docs = documents.filter((row) => row.doc.clientId === client.id);
      const billed = docs
        .filter((row) => row.doc.type !== "BL")
        .reduce((sum, row) => sum + row.total, 0);
      const open = docs
        .filter((row) => row.doc.status === "sent" || row.doc.status === "partial" || row.doc.status === "overdue")
        .reduce((sum, row) => sum + row.total, 0);
      return { client, count: docs.length, billed, open };
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[23px] font-extrabold tracking-tight">Clients</h1>
          <p className="mt-0.5 text-[13px] text-slate-600">
            {clients.length} client{clients.length > 1 ? "s" : ""} dans votre carnet
          </p>
        </div>
        <Link
          href="/app/documents/nouveau?type=FAC"
          className="btn min-h-11 bg-brand-500 px-4 text-[14px] text-white hover:bg-brand-600"
        >
          Facturer un client
        </Link>
      </div>

      <form action="/app/clients" className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Rechercher un nom ou un numéro…"
          className="field pl-10 text-[14px]"
          aria-label="Rechercher un client"
        />
      </form>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users className="size-5" />}
            title={clients.length === 0 ? "Aucun client pour l'instant" : "Aucun résultat"}
            description={
              clients.length === 0
                ? "Vos clients sont créés automatiquement quand vous faites une facture."
                : "Essayez un autre nom ou un autre numéro."
            }
            action={
              <Link
                href="/app/documents/nouveau?type=FAC"
                className="btn w-full bg-brand-500 text-white hover:bg-brand-600"
              >
                Créer une facture
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ client, count, billed, open }) => (
            <li key={client.id}>
              <Link
                href={`/app/clients/${client.id}`}
                className="card flex items-center gap-3 p-3.5 transition hover:border-brand-200 hover:shadow-md"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-[12px] font-bold text-brand-700">
                  {client.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold">{client.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-slate-500">
                    <Phone className="size-3" /> {client.phone || "Pas de numéro"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-extrabold">{amount(billed)}</p>
                  <p className="text-[11px] text-slate-400">
                    {count} document{count > 1 ? "s" : ""}
                  </p>
                </div>
                {open > 0 && <Badge tone="warning">{amount(open)}</Badge>}
                <ChevronRight className="size-4 shrink-0 text-slate-300" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
