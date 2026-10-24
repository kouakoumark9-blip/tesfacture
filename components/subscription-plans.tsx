"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { amount } from "@/lib/format";
import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/plans";
import { submitPaymentRequest } from "@/lib/subscription";
import { Alert } from "./ui";

export default function SubscriptionPlans({
  currentPlan,
  waveLinks,
  pendingRequest,
}: {
  currentPlan: PlanId;
  waveLinks: Record<string, string>;
  pendingRequest: { plan: string; reference: string; createdAt: string } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<PlanId>(currentPlan === "free" ? "pro" : currentPlan);
  const [step, setStep] = useState<"choose" | "reference" | "done">(pendingRequest ? "done" : "choose");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  const plan = PLANS[selected];
  const waveLink = waveLinks[selected] ?? "";

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await submitPaymentRequest({ plan: selected, reference });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStep("done");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const definition = PLANS[id];
          const isCurrent = id === currentPlan;
          const isSelected = id === selected;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSelected(id);
                setStep("choose");
              }}
              disabled={id === "free"}
              className={clsx(
                "card relative p-4 text-left transition",
                isSelected ? "border-brand-500 ring-2 ring-brand-100" : "hover:border-brand-200",
                id === "free" && "opacity-80"
              )}
            >
              {definition.badge && (
                <span className="absolute right-3 top-3 rounded-full bg-accent-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {definition.badge}
                </span>
              )}
              <p className="text-[13px] font-bold uppercase tracking-wide text-slate-400">
                {definition.label}
              </p>
              <p className="mt-1 text-[22px] font-extrabold tracking-tight">
                {definition.price === 0 ? "0" : amount(definition.price)}
                <span className="ml-1 text-[11px] font-semibold text-slate-400">FCFA / mois</span>
              </p>
              <ul className="mt-2.5 space-y-1">
                {definition.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-1.5 text-[12px] text-slate-600">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              {isCurrent && (
                <p className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-bold text-brand-700">
                  <Check className="size-3" /> Votre plan actuel
                </p>
              )}
            </button>
          );
        })}
      </div>

      {error && <Alert>{error}</Alert>}

      {step === "done" || pendingRequest ? (
        <section className="card p-4">
          {pendingRequest && (
            <>
              <h2 className="text-[14px] font-bold">Paiement en cours de vérification</h2>
              <p className="mt-1 text-[12.5px] text-slate-600">
                Plan {PLANS[pendingRequest.plan as PlanId]?.label ?? pendingRequest.plan} · référence{" "}
                <span className="font-semibold">{pendingRequest.reference}</span> · envoyée le{" "}
                {new Date(pendingRequest.createdAt).toLocaleDateString("fr-FR")}
              </p>
              <p className="mt-2 rounded-lg bg-canvas px-3 py-2 text-[11.5px] text-slate-500">
                L&apos;administrateur vérifie le paiement et active votre plan sous 24 h. Vous
                recevrez une facture d&apos;abonnement dans votre compte.
              </p>
            </>
          )}
          <button
            onClick={() => {
              setStep("choose");
              router.refresh();
            }}
            className="btn mt-3 w-full border border-black/10 bg-white text-[13px]"
          >
            Envoyer une autre référence
          </button>
        </section>
      ) : (
        <section className="card p-4">
          <h2 className="text-[14px] font-bold">Payer avec Wave</h2>
          <ol className="mt-2 space-y-1.5 text-[12.5px] text-slate-600">
            <li>1. Ouvrez le lien Wave ci-dessous et payez {amount(plan.price)} FCFA.</li>
            <li>2. Revenez ici et saisissez la référence ou le numéro qui a payé.</li>
            <li>3. Votre plan est activé dès vérification par l&apos;administrateur.</li>
          </ol>

          <a
            href={waveLink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              "btn mt-3 w-full",
              waveLink ? "bg-[#1DC8FF] text-slate-900 hover:brightness-95" : "cursor-not-allowed border border-black/10 bg-white text-slate-400"
            )}
            aria-disabled={!waveLink}
          >
            <Sparkles className="size-4" />
            Payer avec Wave — {amount(plan.price)} FCFA
            <ExternalLink className="size-3.5" />
          </a>
          {!waveLink && (
            <p className="hint">
              Lien de paiement non configuré (WAVE_LINK_{selected.toUpperCase()}).
            </p>
          )}

          <div className="mt-3">
            <label className="label" htmlFor="reference">
              Référence du paiement ou numéro qui a payé
            </label>
            <input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex. 0707080910 ou TW-889231"
              className="field"
            />
          </div>

          <button
            onClick={submit}
            disabled={pending || reference.trim().length < 3}
            className="btn mt-3 w-full bg-brand-500 text-white hover:bg-brand-600"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Envoyer pour vérification
          </button>
        </section>
      )}
    </div>
  );
}
