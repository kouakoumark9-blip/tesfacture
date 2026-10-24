"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, AlertCircle, Trash2 } from "lucide-react";
import type { Client } from "@/lib/types";
import { saveClientAction, deleteClientAction } from "@/lib/actions";

const fields: {
  key: keyof Omit<Client, "id" | "createdAt">;
  label: string;
  placeholder: string;
  type?: string;
  full?: boolean;
}[] = [
  { key: "company", label: "Entreprise", placeholder: "Nova Digital SARL", full: true },
  { key: "name", label: "Contact principal", placeholder: "Awa Traoré" },
  { key: "taxId", label: "NCC / Identifiant fiscal", placeholder: "CI-2024-884512-A" },
  { key: "email", label: "Email", placeholder: "contact@entreprise.ci", type: "email" },
  { key: "phone", label: "Téléphone", placeholder: "+225 07 00 00 00 00" },
  { key: "address", label: "Adresse", placeholder: "Cocody Angré, 8e tranche", full: true },
  { key: "city", label: "Ville", placeholder: "Abidjan" },
  { key: "country", label: "Pays", placeholder: "Côte d'Ivoire" },
];

export default function ClientForm({ client }: { client?: Client }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const [values, setValues] = useState({
    company: client?.company ?? "",
    name: client?.name ?? "",
    taxId: client?.taxId ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    address: client?.address ?? "",
    city: client?.city ?? "Abidjan",
    country: client?.country ?? "Côte d'Ivoire",
    notes: client?.notes ?? "",
  });

  function set(key: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await saveClientAction({ id: client?.id, ...values });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(res.id ? `/clients/${res.id}` : "/clients");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
          <AlertCircle className="size-4" /> {error}
        </div>
      )}

      <div className="card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-slate-600">
                {f.label}
              </label>
              <input
                type={f.type ?? "text"}
                value={values[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="input-base"
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[12.5px] font-semibold text-slate-600">
              Notes internes
            </label>
            <textarea
              value={values.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Conditions de paiement négociées, interlocuteurs, historique…"
              className="input-base resize-none"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          {client ? (
            confirming ? (
              <div className="flex items-center gap-2">
                <span className="text-[12.5px] font-medium text-rose-700">
                  Supprimer ce client et ses documents ?
                </span>
                <button
                  onClick={() => startTransition(async () => {
                    await deleteClientAction(client.id, "/clients");
                    router.refresh();
                  })}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-rose-700"
                >
                  Confirmer
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="rounded-lg px-2 py-1.5 text-[12px] font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 hover:text-rose-600"
              >
                <Trash2 className="size-3.5" /> Supprimer le client
              </button>
            )
          ) : (
            <span />
          )}

          <button
            onClick={submit}
            disabled={pending}
            className="btn-base bg-brand-600 text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {client ? "Enregistrer" : "Créer le client"}
          </button>
        </div>
      </div>
    </div>
  );
}
