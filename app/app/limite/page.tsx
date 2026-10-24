import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/session";
import { PLANS, documentsThisMonth, effectivePlan } from "@/lib/plan";
import { amount } from "@/lib/format";

export const metadata = { title: "Limite atteinte — TesFacture" };
export const dynamic = "force-dynamic";

export default async function LimitePage() {
  const user = await requireUser();
  const plan = await effectivePlan(user.id);
  const used = await documentsThisMonth(user.id);

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-5 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent-50 text-accent-600">
          <Sparkles className="size-5" />
        </span>
        <h1 className="mt-3 text-[21px] font-extrabold tracking-tight">Passez au plan Pro</h1>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-600">
          {plan === "free" ? (
            <>
              Vous avez utilisé vos <strong>{PLANS.free.documentsPerMonth} documents gratuits</strong> ce
              mois-ci ({used} créés). Le plan Pro débloque les documents illimités.
            </>
          ) : (
            <>Votre plan actuel ne permet pas de créer ce document.</>
          )}
        </p>

        <ul className="mt-4 space-y-1.5 text-left">
          {PLANS.pro.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-[13px] text-slate-700">
              <Check className="mt-0.5 size-4 shrink-0 text-brand-500" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-xl bg-canvas px-3 py-2.5">
          <p className="text-[12px] text-slate-500">Plan Pro</p>
          <p className="text-[20px] font-extrabold text-brand-700">
            {amount(PLANS.pro.price)}{" "}
            <span className="text-[11px] font-semibold text-slate-400">FCFA / mois</span>
          </p>
        </div>

        <Link
          href="/app/abonnement"
          className="btn mt-4 w-full bg-brand-500 text-white hover:bg-brand-600"
        >
          Voir les plans et payer <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/app"
          className="btn mt-2 w-full border border-black/10 bg-white text-[13px] text-slate-600"
        >
          Revenir au tableau de bord
        </Link>
      </div>
    </div>
  );
}
