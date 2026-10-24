import Link from "next/link";
import { Search, TrendingUp, Users, Wallet } from "lucide-react";
import {
  adminOverview,
  listAdminLog,
  listPaymentRequests,
  listUsers,
} from "@/lib/admin";
import { amount, dateShort, dateTime } from "@/lib/format";
import { PLANS } from "@/lib/plan";
import { Badge } from "@/components/ui";
import { RequestActions, UserActions } from "@/components/admin-actions";

export const dynamic = "force-dynamic";

const PLAN_LABEL: Record<string, string> = { free: "Gratuit", pro: "Pro", business: "Business" };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [overview, requests, users, log] = await Promise.all([
    adminOverview(),
    listPaymentRequests("pending"),
    listUsers(q),
    listAdminLog(20),
  ]);

  const kpis = [
    { label: "Utilisateurs", value: String(overview.usersTotal), hint: `${overview.newThisWeek} nouveaux cette semaine`, icon: Users },
    { label: "Actifs (30 j)", value: String(overview.activeLast30Days), hint: "Au moins un document créé", icon: TrendingUp },
    { label: "Revenu mensuel", value: `${amount(overview.mrr)} FCFA`, hint: `${overview.byPlan.pro} Pro · ${overview.byPlan.business} Business`, icon: Wallet },
    { label: "Gratuit → payant", value: overview.conversionRate === null ? "—" : `${overview.conversionRate} %`, hint: "Part d'abonnés payants", icon: TrendingUp },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[23px] font-extrabold tracking-tight">Administration</h1>
        <p className="mt-0.5 text-[13px] text-slate-600">
          Utilisateurs, demandes de paiement et journal des actions.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card p-4">
            <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600">
              <kpi.icon className="size-[18px]" />
            </span>
            <p className="mt-3 text-[12px] font-medium text-slate-500">{kpi.label}</p>
            <p className="text-[19px] font-extrabold tracking-tight">{kpi.value}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{kpi.hint}</p>
          </div>
        ))}
      </div>

      {/* Demandes de paiement */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
          <div>
            <h2 className="text-[14px] font-bold">Demandes de paiement en attente</h2>
            <p className="text-[11.5px] text-slate-500">
              Validation manuelle des paiements Wave
            </p>
          </div>
          <Badge tone={requests.length > 0 ? "accent" : "neutral"}>{requests.length}</Badge>
        </div>

        {requests.length === 0 ? (
          <p className="px-4 py-8 text-center text-[12.5px] text-slate-500">
            Aucune demande en attente.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[12.5px]">
              <thead className="bg-black/[0.02] text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-bold">Utilisateur</th>
                  <th className="px-4 py-2 font-bold">Plan</th>
                  <th className="px-4 py-2 font-bold">Montant</th>
                  <th className="px-4 py-2 font-bold">Référence</th>
                  <th className="px-4 py-2 font-bold">Date</th>
                  <th className="px-4 py-2 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {requests.map(({ request, userName, userPhone }) => (
                  <tr key={request.id}>
                    <td className="px-4 py-2.5">
                      <p className="font-semibold">{userName}</p>
                      <p className="text-[11px] text-slate-400">{userPhone}</p>
                    </td>
                    <td className="px-4 py-2.5">{PLAN_LABEL[request.plan] ?? request.plan}</td>
                    <td className="px-4 py-2.5 font-semibold">{amount(Number(request.amount))}</td>
                    <td className="px-4 py-2.5">{request.reference}</td>
                    <td className="px-4 py-2.5 text-slate-500">{dateShort(request.createdAt)}</td>
                    <td className="px-4 py-2.5">
                      <RequestActions requestId={request.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Utilisateurs */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 px-4 py-3">
          <h2 className="text-[14px] font-bold">Utilisateurs</h2>
          <form action="/admin" className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Nom ou téléphone…"
              className="field min-h-9 py-1.5 pl-9 text-[12.5px]"
              aria-label="Rechercher un utilisateur"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[12.5px]">
            <thead className="bg-black/[0.02] text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-2 font-bold">Utilisateur</th>
                <th className="px-4 py-2 font-bold">Plan</th>
                <th className="px-4 py-2 font-bold">Expiration</th>
                <th className="px-4 py-2 font-bold">Documents</th>
                <th className="px-4 py-2 font-bold">Inscription</th>
                <th className="px-4 py-2 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {users.map((row) => (
                <tr key={row.user.id} className={row.user.suspendedAt ? "opacity-60" : ""}>
                  <td className="px-4 py-2.5">
                    <p className="font-semibold">
                      {row.user.name}
                      {row.user.role === "admin" && (
                        <span className="ml-1.5 rounded bg-slate-900 px-1.5 py-0.5 text-[9.5px] font-bold text-white">
                          ADMIN
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400">{row.user.phone}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={row.effectivePlanId === "free" ? "neutral" : "success"}>
                      {PLAN_LABEL[row.effectivePlanId]}
                    </Badge>
                    {row.effectivePlanId !== "free" && (
                      <span className="ml-1 text-[11px] text-slate-400">
                        {PLANS[row.effectivePlanId].price.toLocaleString("fr-FR")} F
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {row.user.planExpiresAt ? dateShort(row.user.planExpiresAt) : "—"}
                  </td>
                  <td className="px-4 py-2.5">{row.documentsCount}</td>
                  <td className="px-4 py-2.5 text-slate-500">{dateShort(row.user.createdAt)}</td>
                  <td className="px-4 py-2.5">
                    <UserActions
                      userId={row.user.id}
                      plan={row.effectivePlanId}
                      suspended={Boolean(row.user.suspendedAt)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Journal */}
      <section className="card overflow-hidden">
        <div className="border-b border-black/5 px-4 py-3">
          <h2 className="text-[14px] font-bold">Journal des actions administrateur</h2>
        </div>
        {log.length === 0 ? (
          <p className="px-4 py-8 text-center text-[12.5px] text-slate-500">Aucune action pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {log.map(({ action, adminName }) => (
              <li key={action.id} className="flex flex-wrap items-baseline gap-2 px-4 py-2.5 text-[12px]">
                <span className="font-semibold">{adminName ?? "Admin"}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-bold text-slate-600">
                  {action.action}
                </span>
                <span className="min-w-0 flex-1 text-slate-500">{action.details}</span>
                <span className="text-slate-400">{dateTime(action.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="pb-4 text-center text-[11.5px] text-slate-400">
        Les factures d&apos;abonnement sont générées automatiquement dans votre compte.{" "}
        <Link href="/app/factures" className="font-semibold text-brand-600 hover:underline">
          Voir mes factures
        </Link>
      </p>
    </div>
  );
}
