import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/session";
import { effectivePlan, documentsThisMonth, isPaidPlan, PLANS } from "@/lib/plan";
import { getDb } from "@/db/client";
import { paymentRequests, users } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { dateShort, daysUntil, todayISO } from "@/lib/format";
import SubscriptionPlans from "@/components/subscription-plans";
import { Badge } from "@/components/ui";

export const metadata = { title: "Mon abonnement — TesFacture" };
export const dynamic = "force-dynamic";

export default async function AbonnementPage() {
  const session = await requireUser();
  const plan = await effectivePlan(session.id);
  const used = await documentsThisMonth(session.id);

  const db = await getDb();
  const userRows = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  const user = userRows[0];

  const requests = await db
    .select()
    .from(paymentRequests)
    .where(and(eq(paymentRequests.userId, session.id)))
    .orderBy(desc(paymentRequests.createdAt))
    .limit(5);

  const pendingRequest = requests.find((r) => r.status === "pending") ?? null;
  const expiry = user?.planExpiresAt ? user.planExpiresAt.toISOString().slice(0, 10) : null;
  const daysLeft = expiry ? daysUntil(expiry) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" /> Accueil
      </Link>

      <div>
        <h1 className="text-[23px] font-extrabold tracking-tight">Mon abonnement</h1>
        <p className="mt-0.5 text-[13px] text-slate-600">
          Plan actuel : <span className="font-bold text-slate-800">{PLANS[plan].label}</span>
          {isPaidPlan(plan) && expiry ? ` · jusqu'au ${dateShort(expiry)}` : ""}
        </p>
      </div>

      {isPaidPlan(plan) && daysLeft !== null && daysLeft <= 5 && daysLeft >= 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] text-amber-900">
          <Clock className="mt-0.5 size-4 shrink-0" />
          <span>
            Votre plan {PLANS[plan].label} se termine dans <strong>{daysLeft} jour(s)</strong>.
            Renouvelez pour éviter le retour au plan Gratuit.
          </span>
        </div>
      )}

      {!isPaidPlan(plan) && (
        <div className="flex items-start gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-3 text-[13px] text-slate-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-accent-500" />
          <span>
            Plan Gratuit : {used} / {PLANS.free.documentsPerMonth ?? 5} documents utilisés ce mois-ci.
            {used >= (PLANS.free.documentsPerMonth ?? 5) && " Limite atteinte — passez au plan Pro pour continuer."}
          </span>
        </div>
      )}

      <SubscriptionPlans
        currentPlan={plan}
        waveLinks={{
          pro: process.env.WAVE_LINK_PRO ?? "",
          business: process.env.WAVE_LINK_BUSINESS ?? "",
          free: "",
        }}
        pendingRequest={
          pendingRequest
            ? {
                plan: pendingRequest.plan,
                reference: pendingRequest.reference,
                createdAt: pendingRequest.createdAt.toISOString(),
              }
            : null
        }
      />

      {requests.length > 0 && (
        <section className="card overflow-hidden">
          <div className="border-b border-black/5 px-4 py-3">
            <h2 className="text-[14px] font-bold">Historique des demandes</h2>
          </div>
          <ul className="divide-y divide-black/5">
            {requests.map((request) => (
              <li key={request.id} className="flex items-center gap-2 px-4 py-2.5 text-[12.5px]">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {PLANS[request.plan as "pro" | "business"]?.label ?? request.plan} ·{" "}
                    {new Intl.NumberFormat("fr-FR").format(Number(request.amount))} FCFA
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Réf. {request.reference} · {dateShort(request.createdAt)}
                  </p>
                </div>
                <Badge
                  tone={
                    request.status === "validated"
                      ? "success"
                      : request.status === "rejected"
                        ? "danger"
                        : "warning"
                  }
                >
                  {request.status === "validated"
                    ? "Validée"
                    : request.status === "rejected"
                      ? "Rejetée"
                      : "En vérification"}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="flex items-start gap-1.5 px-1 pb-4 text-[11.5px] text-slate-400">
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
        Aucune donnée n&apos;est supprimée en cas de retour au plan Gratuit : vos documents restent
        consultables et exportables.
      </p>
    </div>
  );
}
