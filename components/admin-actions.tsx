"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, KeyRound, Loader2, ShieldOff, X } from "lucide-react";
import {
  adminChangePlan,
  adminReactivateUser,
  adminResetPassword,
  adminSuspendUser,
  rejectPaymentRequest,
  validatePaymentRequest,
} from "@/lib/subscription";
import type { PlanId } from "@/lib/plan";
import { Alert } from "./ui";

function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string; password?: string }>) =>
    startTransition(async () => {
      setMessage(null);
      const result = await fn();
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error ?? "Action impossible." });
        return;
      }
      setMessage({
        tone: "success",
        text: result.password
          ? `Mot de passe temporaire : ${result.password}`
          : result.message ?? "Action effectuée.",
      });
      router.refresh();
    });

  return { pending, run, message };
}

export function RequestActions({ requestId }: { requestId: string }) {
  const { pending, run, message } = useAction();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        onClick={() => run(() => validatePaymentRequest(requestId))}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1.5 text-[11.5px] font-bold text-white hover:bg-brand-600"
      >
        {pending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />} Valider
      </button>
      <button
        onClick={() => run(() => rejectPaymentRequest(requestId))}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-slate-600 hover:bg-red-50 hover:text-red-600"
      >
        <X className="size-3" /> Rejeter
      </button>
      {message && (
        <span
          className={`text-[11px] font-semibold ${message.tone === "error" ? "text-red-600" : "text-brand-700"}`}
        >
          {message.text}
        </span>
      )}
    </div>
  );
}

export function UserActions({
  userId,
  plan,
  suspended,
}: {
  userId: string;
  plan: PlanId;
  suspended: boolean;
}) {
  const { pending, run, message } = useAction();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <select
        value={plan}
        onChange={(e) => run(() => adminChangePlan(userId, e.target.value as PlanId))}
        disabled={pending}
        className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-[11.5px] font-semibold"
        aria-label="Changer de plan"
      >
        <option value="free">Gratuit</option>
        <option value="pro">Pro</option>
        <option value="business">Business</option>
      </select>

      <button
        onClick={() => run(() => adminResetPassword(userId))}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2 py-1.5 text-[11.5px] font-semibold text-slate-600 hover:bg-black/[0.03]"
        title="Réinitialiser le mot de passe"
      >
        <KeyRound className="size-3" /> Mot de passe
      </button>

      {suspended ? (
        <button
          onClick={() => run(() => adminReactivateUser(userId))}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-2 py-1.5 text-[11.5px] font-semibold text-white"
        >
          Réactiver
        </button>
      ) : (
        <button
          onClick={() => run(() => adminSuspendUser(userId))}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1.5 text-[11.5px] font-semibold text-red-600 hover:bg-red-50"
        >
          <ShieldOff className="size-3" /> Suspendre
        </button>
      )}

      {message && (
        <span
          className={`w-full text-[11px] font-semibold ${message.tone === "error" ? "text-red-600" : "text-brand-700"}`}
        >
          {message.text}
        </span>
      )}
    </div>
  );
}

export function AdminError({ children }: { children: React.ReactNode }) {
  return <Alert>{children}</Alert>;
}
