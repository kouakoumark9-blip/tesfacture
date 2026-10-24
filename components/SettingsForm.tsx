"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, CheckCircle2, RotateCcw, AlertCircle } from "lucide-react";
import type { Company, Settings } from "@/lib/types";
import { saveSettingsAction, resetDemoData } from "@/lib/actions";

const companyFields: { key: keyof Company; label: string; full?: boolean; placeholder: string }[] = [
  { key: "name", label: "Raison sociale", placeholder: "TESFACTURE" },
  { key: "legalForm", label: "Forme juridique", placeholder: "SARL" },
  { key: "logoText", label: "Monogramme (2 lettres)", placeholder: "TF" },
  { key: "email", label: "Email", placeholder: "contact@exemple.ci" },
  { key: "phone", label: "Téléphone", placeholder: "+225 ..." },
  { key: "website", label: "Site web", placeholder: "www.exemple.ci" },
  { key: "address", label: "Adresse", placeholder: "Rue, immeuble", full: true },
  { key: "city", label: "Ville", placeholder: "Abidjan" },
  { key: "country", label: "Pays", placeholder: "Côte d'Ivoire" },
  { key: "taxId", label: "NCC / Identifiant fiscal", placeholder: "CI-2024-..." },
  { key: "rccm", label: "RCCM", placeholder: "CI-ABJ-..." },
  { key: "bank", label: "Banque", placeholder: "SIB", full: true },
  { key: "iban", label: "IBAN / Compte bancaire", placeholder: "CI93 ...", full: true },
];

export default function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const [company, setCompany] = useState<Company>(settings.company);
  const [general, setGeneral] = useState({
    currency: settings.currency,
    vatRate: String(settings.vatRate),
    invoicePrefix: settings.invoicePrefix,
    quotePrefix: settings.quotePrefix,
    paymentTerms: String(settings.paymentTerms),
    quoteValidity: String(settings.quoteValidity),
    footerNote: settings.footerNote,
    paymentInstructions: settings.paymentInstructions,
  });

  function setCompanyField(key: keyof Company, value: string) {
    setCompany((c) => ({ ...c, [key]: value }));
  }

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await saveSettingsAction({
        company,
        currency: general.currency || "FCFA",
        vatRate: Number(general.vatRate) || 0,
        invoicePrefix: general.invoicePrefix.toUpperCase() || "FAC",
        quotePrefix: general.quotePrefix.toUpperCase() || "DEV",
        paymentTerms: Number(general.paymentTerms) || 30,
        quoteValidity: Number(general.quoteValidity) || 15,
        footerNote: general.footerNote,
        paymentInstructions: general.paymentInstructions,
      });
      if (!res.ok) {
        setError("Impossible d'enregistrer les paramètres.");
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <div className="space-y-5">
      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">
          <CheckCircle2 className="size-4" /> Paramètres enregistrés.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
          <AlertCircle className="size-4" /> {error}
        </div>
      )}

      <section className="card p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold text-slate-900">Identité de l&apos;entreprise</h2>
        <p className="mt-0.5 text-[12.5px] text-slate-500">
          Bloc affiché en en-tête de chaque document.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {companyFields.map((f) => (
            <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-slate-600">
                {f.label}
              </label>
              <input
                value={company[f.key] ?? ""}
                onChange={(e) => setCompanyField(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="input-base"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold text-slate-900">Facturation</h2>
        <p className="mt-0.5 text-[12.5px] text-slate-500">
          Devise, TVA par défaut et numérotation des documents.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Devise">
            <input
              value={general.currency}
              onChange={(e) => setGeneral((g) => ({ ...g, currency: e.target.value }))}
              className="input-base"
            />
          </Field>
          <Field label="TVA par défaut (%)">
            <input
              type="number"
              value={general.vatRate}
              onChange={(e) => setGeneral((g) => ({ ...g, vatRate: e.target.value }))}
              className="input-base"
            />
          </Field>
          <Field label="Délai de paiement (jours)">
            <input
              type="number"
              value={general.paymentTerms}
              onChange={(e) => setGeneral((g) => ({ ...g, paymentTerms: e.target.value }))}
              className="input-base"
            />
          </Field>
          <Field label="Préfixe factures">
            <input
              value={general.invoicePrefix}
              onChange={(e) => setGeneral((g) => ({ ...g, invoicePrefix: e.target.value }))}
              className="input-base"
            />
          </Field>
          <Field label="Préfixe devis">
            <input
              value={general.quotePrefix}
              onChange={(e) => setGeneral((g) => ({ ...g, quotePrefix: e.target.value }))}
              className="input-base"
            />
          </Field>
          <Field label="Validité des devis (jours)">
            <input
              type="number"
              value={general.quoteValidity}
              onChange={(e) => setGeneral((g) => ({ ...g, quoteValidity: e.target.value }))}
              className="input-base"
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-4">
          <Field label="Pied de page des documents">
            <textarea
              value={general.footerNote}
              onChange={(e) => setGeneral((g) => ({ ...g, footerNote: e.target.value }))}
              rows={2}
              className="input-base resize-none"
            />
          </Field>
          <Field label="Conditions de règlement">
            <textarea
              value={general.paymentInstructions}
              onChange={(e) => setGeneral((g) => ({ ...g, paymentInstructions: e.target.value }))}
              rows={3}
              className="input-base resize-none"
            />
          </Field>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {confirmReset ? (
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] font-medium text-rose-700">
              Réinitialiser toutes les données de démonstration ?
            </span>
            <button
              onClick={() =>
                startTransition(async () => {
                  await resetDemoData();
                  setConfirmReset(false);
                  router.refresh();
                })
              }
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-rose-700"
            >
              Confirmer
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="rounded-lg px-2 py-1.5 text-[12px] font-semibold text-slate-500 hover:bg-slate-100"
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 hover:text-rose-600"
          >
            <RotateCcw className="size-3.5" /> Réinitialiser les données de démo
          </button>
        )}

        <button
          onClick={save}
          disabled={pending}
          className="btn-base bg-brand-600 text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Enregistrer les paramètres
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}
