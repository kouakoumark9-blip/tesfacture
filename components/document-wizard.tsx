"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  FileDown,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import type { PreviewDoc } from "@/lib/preview";
import { DOC_TYPE_LABEL } from "@/lib/preview";
import { amount, dateShort, todayISO, addDaysISO } from "@/lib/format";
import { amountInWords } from "@/lib/money";
import {
  MOBILE_MONEY_METHODS,
  PAYMENT_METHODS,
  buildInstallments,
  computeTotals,
} from "@/lib/calc";
import { saveDocumentAction } from "@/lib/actions/documents";
import { queueDocument } from "@/lib/offline-queue";
import DocumentPreview from "./document-preview";
import { Alert } from "./ui";

type DocType = "FAC" | "DEV" | "BL";

export type WizardClient = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export type WizardInitial = {
  id: string;
  type: DocType;
  number: string;
  issueDate: string;
  dueDate: string;
  discountPercent: number;
  vatPercent: number;
  note: string;
  paymentMethods: string[];
  deliveryAddress: string;
  deliveredBy: string;
  clientId: string | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  lines: { description: string; quantity: number; unitPrice: number }[];
  installments: { label: string; amount: number; dueDate: string }[];
};

type Line = { key: string; description: string; quantity: string; unitPrice: string };

const TEMPLATES: { label: string; lines: Omit<Line, "key">[] }[] = [
  {
    label: "Création de site web",
    lines: [
      { description: "Création de site web", quantity: "1", unitPrice: "250000" },
      { description: "Nom de domaine et hébergement (1 an)", quantity: "1", unitPrice: "45000" },
    ],
  },
  {
    label: "Prestation de service",
    lines: [{ description: "Prestation de service", quantity: "1", unitPrice: "50000" }],
  },
  {
    label: "Vente de marchandises",
    lines: [{ description: "Vente de marchandises", quantity: "1", unitPrice: "25000" }],
  },
];

const uid = () => Math.random().toString(36).slice(2, 9);

const emptyLine = (): Line => ({ key: uid(), description: "", quantity: "1", unitPrice: "" });

export default function DocumentWizard({
  type,
  initial,
  clients,
  company,
  showWatermark,
  nextNumberPreview,
}: {
  type: DocType;
  initial?: WizardInitial;
  nextNumberPreview: string;
  clients: WizardClient[];
  company: {
    name: string;
    logo: string | null;
    rccm: string | null;
    taxNumber: string | null;
    address: string | null;
    phone: string | null;
    paymentNumbers: Record<string, string | undefined>;
    defaultNote: string | null;
  } | null;
  showWatermark: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);

  const isBL = type === "BL";
  const issueDate = initial?.issueDate ?? todayISO();

  // ── Étape 1 : client
  const [clientId, setClientId] = useState<string | null>(initial?.clientId ?? null);
  const [clientName, setClientName] = useState(initial?.clientName ?? "");
  const [clientPhone, setClientPhone] = useState(initial?.clientPhone ?? "");
  const [clientEmail, setClientEmail] = useState(initial?.clientEmail ?? "");
  const [clientAddress, setClientAddress] = useState(initial?.clientAddress ?? "");
  const [deliveryAddress, setDeliveryAddress] = useState(initial?.deliveryAddress ?? "");
  const [deliveredBy, setDeliveredBy] = useState(initial?.deliveredBy ?? "");
  const [suggestOpen, setSuggestOpen] = useState(false);

  // ── Étape 2 : lignes
  const [lines, setLines] = useState<Line[]>(
    initial?.lines.length
      ? initial.lines.map((l) => ({
          key: uid(),
          description: l.description,
          quantity: String(l.quantity),
          unitPrice: String(l.unitPrice),
        }))
      : [emptyLine()]
  );

  // ── Étape 3 : conditions
  const [discountPercent, setDiscountPercent] = useState(
    initial ? String(initial.discountPercent) : "0"
  );
  const [vatPercent, setVatPercent] = useState<0 | 18>(initial ? ((initial.vatPercent as 0 | 18) ?? 0) : 18);
  const [dueDate, setDueDate] = useState(initial?.dueDate || addDaysISO(issueDate, 30));
  const [note, setNote] = useState(initial?.note ?? company?.defaultNote ?? "");
  const [paymentMethods, setPaymentMethods] = useState<string[]>(initial?.paymentMethods ?? []);
  const [numbers, setNumbers] = useState({
    wave: company?.paymentNumbers?.wave ?? "",
    orange: company?.paymentNumbers?.orange ?? "",
    mtn: company?.paymentNumbers?.mtn ?? "",
    moov: company?.paymentNumbers?.moov ?? "",
  });
  const [installmentCount, setInstallmentCount] = useState(
    initial?.installments.length && initial.installments.length > 1
      ? initial.installments.length
      : 1
  );
  const [deposit, setDeposit] = useState(
    initial?.installments.length && initial.installments.length > 1
      ? String(initial.installments[0].amount)
      : ""
  );
  const [customPlan, setCustomPlan] = useState<
    { label: string; amount: string; dueDate: string }[] | null
  >(
    initial?.installments.length
      ? initial.installments.map((i) => ({
          label: i.label,
          amount: String(i.amount),
          dueDate: i.dueDate || initial.dueDate,
        }))
      : null
  );

  const totals = useMemo(
    () =>
      computeTotals({
        lines: lines.map((l) => ({
          quantity: Number(l.quantity) || 0,
          unitPrice: Number(l.unitPrice) || 0,
        })),
        discountPercent: Number(discountPercent) || 0,
        vatPercent,
      }),
    [lines, discountPercent, vatPercent]
  );

  const generatedPlan = useMemo(
    () =>
      buildInstallments(totals.total, installmentCount, Number(deposit) || 0).map((item) => ({
        ...item,
        dueDate: dueDate || addDaysISO(issueDate, 30),
      })),
    [totals.total, installmentCount, deposit, dueDate, issueDate]
  );

  const plan = customPlan ?? generatedPlan.map((p) => ({ ...p, amount: String(p.amount) }));
  const planSum = plan.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const planValid = isBL || Math.abs(planSum - totals.total) < 0.01;

  function regeneratePlan(nextCount: number, nextDeposit: string) {
    setCustomPlan(null);
    setInstallmentCount(nextCount);
    setDeposit(nextDeposit);
  }

  const filteredClients = useMemo(() => {
    const q = clientName.trim().toLowerCase();
    if (!q) return clients.slice(0, 5);
    return clients.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6);
  }, [clients, clientName]);

  function pickClient(client: WizardClient) {
    setClientId(client.id);
    setClientName(client.name);
    setClientPhone(client.phone ?? "");
    setClientEmail(client.email ?? "");
    setClientAddress(client.address ?? "");
    setSuggestOpen(false);
  }

  const preview: PreviewDoc = {
    id: initial?.id ?? "",
    type,
    number: initial?.number ?? nextNumberPreview,
    status: "draft",
    issueDate,
    dueDate: isBL ? null : dueDate,
    discountPercent: Number(discountPercent) || 0,
    vatPercent,
    subtotal: isBL ? 0 : totals.subtotal,
    discountAmount: isBL ? 0 : totals.discountAmount,
    vatAmount: isBL ? 0 : totals.vatAmount,
    total: isBL ? 0 : totals.total,
    note: note || null,
    paymentMethods: isBL ? [] : paymentMethods,
    deliveryAddress: deliveryAddress || clientAddress || null,
    deliveredBy: deliveredBy || null,
    shareToken: "",
    client: {
      name: clientName || "Nom du client",
      phone: clientPhone || null,
      email: clientEmail || null,
      address: clientAddress || null,
    },
    company: {
      name: company?.name || "Mon entreprise",
      logo: company?.logo ?? null,
      rccm: company?.rccm ?? null,
      taxNumber: company?.taxNumber ?? null,
      address: company?.address ?? null,
      phone: company?.phone ?? null,
      paymentNumbers: numbers,
    },
    items: lines
      .filter((l) => l.description.trim())
      .map((l) => ({
        description: l.description,
        quantity: Number(l.quantity) || 0,
        unitPrice: isBL ? 0 : Number(l.unitPrice) || 0,
        total: isBL ? 0 : (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0),
      })),
    installments: isBL
      ? []
      : plan.map((item, index) => ({
          id: `tmp-${index}`,
          label: item.label,
          amount: Number(item.amount) || 0,
          dueDate: item.dueDate,
          paidAt: null,
          method: null,
        })),
  };

  function validateStep(current: number): string | null {
    if (current === 1) {
      if (!clientName.trim() || clientName.trim().length < 2) {
        return "Indiquez le nom du client.";
      }
      if (isBL && !deliveryAddress.trim() && !clientAddress.trim()) {
        return "Indiquez l'adresse de livraison.";
      }
    }
    if (current === 2) {
      const valid = lines.filter(
        (l) => l.description.trim() && Number(l.quantity) > 0 && (!isBL ? Number(l.unitPrice) >= 0 : true)
      );
      if (valid.length === 0) return "Ajoutez au moins une ligne avec une description.";
    }
    if (current === 3) {
      if (!isBL && !planValid) {
        return `La somme des tranches (${amount(planSum)}) doit être égale au total (${amount(totals.total)}).`;
      }
      const missingNumber = paymentMethods.find(
        (m) => MOBILE_MONEY_METHODS.includes(m as never) && !numbers[numberKeyOf(m) as keyof typeof numbers]
      );
      if (missingNumber) return `Renseignez le numéro ${missingNumber}.`;
    }
    return null;
  }

  function goNext() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep((s) => Math.min(3, s + 1));
  }

  function submit(intent: "save" | "pdf") {
    const message = validateStep(3);
    if (message) {
      setError(message);
      setStep(3);
      return;
    }
    setError(null);

    const payload = {
      id: initial?.id,
      type,
      client: {
        id: clientId ?? undefined,
        name: clientName.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim(),
        address: clientAddress.trim(),
      },
      lines: lines
        .filter((l) => l.description.trim())
        .map((l) => ({
          description: l.description.trim(),
          quantity: Number(l.quantity) || 0,
          unitPrice: isBL ? 0 : Number(l.unitPrice) || 0,
        })),
      discountPercent: Number(discountPercent) || 0,
      vatPercent,
      issueDate,
      dueDate: isBL ? "" : dueDate,
      note: note.trim(),
      paymentMethods: isBL ? [] : paymentMethods,
      paymentNumbers: numbers,
      deliveryAddress: deliveryAddress.trim(),
      deliveredBy: deliveredBy.trim(),
      installmentCount,
      deposit: Number(deposit) || 0,
      installments: isBL
        ? []
        : plan.map((item, index) => ({
            position: index,
            label: item.label,
            amount: Number(item.amount) || 0,
            dueDate: item.dueDate,
          })),
    };

    // Hors connexion : le brouillon part en file d'attente locale
    if (typeof navigator !== "undefined" && !navigator.onLine && !initial) {
      queueDocument(payload);
      router.push("/app/documents");
      return;
    }

    startTransition(async () => {
      const result = await saveDocumentAction(payload);
      if (!result.ok) {
        setError(result.error);
        if (result.error.includes("5 documents")) setLimitReached(true);
        return;
      }
      if (intent === "pdf") {
        window.open(`/api/documents/${result.id}/pdf`, "_blank");
      }
      router.push(`/app/documents/${result.id}${initial ? "" : "?nouveau=1"}`);
      router.refresh();
    });
  }

  const steps = ["Client", "Lignes", isBL ? "Livraison" : "Conditions"];

  return (
    <div className="pb-24">
      {/* Fil d'étapes */}
      <div className="flex items-center gap-1.5">
        {steps.map((label, index) => {
          const number = index + 1;
          const active = step === number;
          const done = step > number;
          return (
            <button
              key={label}
              onClick={() => number < step && setStep(number)}
              className={clsx(
                "flex flex-1 items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition",
                active
                  ? "border-brand-500 bg-brand-50"
                  : done
                    ? "border-brand-200 bg-white"
                    : "border-black/5 bg-white/60"
              )}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={clsx(
                  "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                  active || done ? "bg-brand-500 text-white" : "bg-slate-200 text-slate-500"
                )}
              >
                {done ? <Check className="size-3.5" /> : number}
              </span>
              <span className="min-w-0 truncate text-[12.5px] font-semibold text-slate-700">
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-[11.5px] font-bold text-brand-700">
          {DOC_TYPE_LABEL[type]}
        </span>
        <span className="text-[12px] text-slate-500">
          {initial ? `N° ${initial.number}` : `N° ${nextNumberPreview} à l'enregistrement`}
        </span>
        <span className="text-[12px] text-slate-400">· {dateShort(issueDate)}</span>
      </div>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
          {limitReached && (
            <a
              href="/app/limite"
              className="btn mt-2 w-full bg-accent-500 text-white hover:bg-accent-600"
            >
              Passer au plan Pro
            </a>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_minmax(0,420px)]">
        {/* Formulaire */}
        <div className="space-y-4">
          {step === 1 && (
            <section className="card p-4">
              <h2 className="text-[15px] font-bold">
                {isBL ? "Client et livraison" : "Qui facturez-vous ?"}
              </h2>
              <p className="hint">Tapez les premières lettres pour retrouver un client existant.</p>

              <div className="mt-3">
                <label className="label" htmlFor="clientName">
                  Nom du client *
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      setClientId(null);
                      setSuggestOpen(true);
                    }}
                    onFocus={() => setSuggestOpen(true)}
                    placeholder="Krea Ecom, Mme Traoré…"
                    className="field pl-10"
                    autoComplete="off"
                  />
                  {suggestOpen && filteredClients.length > 0 && !clientId && (
                    <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-black/10 bg-white p-1 shadow-lg">
                      {filteredClients.map((client) => (
                        <li key={client.id}>
                          <button
                            type="button"
                            onClick={() => pickClient(client)}
                            className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left hover:bg-brand-50"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-[13.5px] font-semibold">
                                {client.name}
                              </span>
                              <span className="block truncate text-[11.5px] text-slate-500">
                                {client.phone || client.email || "—"}
                              </span>
                            </span>
                            <Check className="size-4 shrink-0 text-brand-500" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {clientId && (
                  <p className="mt-1 flex items-center gap-1 text-[12px] font-medium text-brand-600">
                    <UserRound className="size-3.5" /> Client du carnet sélectionné
                    <button
                      type="button"
                      onClick={() => setClientId(null)}
                      className="ml-1 text-slate-400 hover:text-slate-700"
                      aria-label="Dissocier"
                    >
                      <X className="size-3.5" />
                    </button>
                  </p>
                )}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="clientPhone">
                    WhatsApp / téléphone
                  </label>
                  <input
                    id="clientPhone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    inputMode="tel"
                    placeholder="07 00 00 00 00"
                    className="field"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="clientEmail">
                    E-mail <span className="font-normal text-slate-400">(facultatif)</span>
                  </label>
                  <input
                    id="clientEmail"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@exemple.ci"
                    className="field"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="label" htmlFor="clientAddress">
                  Adresse du client
                </label>
                <textarea
                  id="clientAddress"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  rows={2}
                  placeholder="Cocody Angré, Abidjan"
                  className="field resize-none"
                />
              </div>

              {isBL && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="label" htmlFor="deliveryAddress">
                      Adresse de livraison *
                    </label>
                    <textarea
                      id="deliveryAddress"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      rows={2}
                      placeholder="Zone 4, rue du Marché, Abidjan"
                      className="field resize-none"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="deliveredBy">
                      Livreur
                    </label>
                    <input
                      id="deliveredBy"
                      value={deliveredBy}
                      onChange={(e) => setDeliveredBy(e.target.value)}
                      placeholder="Nom du livreur"
                      className="field"
                    />
                  </div>
                </div>
              )}
            </section>
          )}

          {step === 2 && (
            <section className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[15px] font-bold">
                  {isBL ? "Articles livrés" : "Que vendez-vous ?"}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATES.map((template) => (
                    <button
                      key={template.label}
                      type="button"
                      onClick={() =>
                        setLines((prev) => {
                          const cleaned = prev.filter((l) => l.description.trim() || l.unitPrice);
                          return [
                            ...cleaned,
                            ...template.lines.map((l) => ({ key: uid(), ...l })),
                          ];
                        })
                      }
                      className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                    >
                      + {template.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 space-y-3">
                {lines.map((line, index) => (
                  <div key={line.key} className="rounded-xl border border-black/5 p-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-3 text-[11px] font-bold text-slate-400">{index + 1}</span>
                      <div className="min-w-0 flex-1 space-y-2">
                        <input
                          value={line.description}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((l) =>
                                l.key === line.key ? { ...l, description: e.target.value } : l
                              )
                            )
                          }
                          placeholder="Description de la prestation"
                          className="field"
                          aria-label={`Description ligne ${index + 1}`}
                        />
                        <div className={clsx("grid gap-2", isBL ? "" : "grid-cols-2")}>
                          <div>
                            <label className="mb-1 block text-[11.5px] font-medium text-slate-500">
                              Quantité
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={line.quantity}
                              onChange={(e) =>
                                setLines((prev) =>
                                  prev.map((l) =>
                                    l.key === line.key ? { ...l, quantity: e.target.value } : l
                                  )
                                )
                              }
                              className="field text-right"
                              aria-label={`Quantité ligne ${index + 1}`}
                            />
                          </div>
                          {!isBL && (
                            <div>
                              <label className="mb-1 block text-[11.5px] font-medium text-slate-500">
                                Prix unitaire (FCFA)
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="500"
                                value={line.unitPrice}
                                onChange={(e) =>
                                  setLines((prev) =>
                                    prev.map((l) =>
                                      l.key === line.key ? { ...l, unitPrice: e.target.value } : l
                                    )
                                  )
                                }
                                placeholder="0"
                                className="field text-right"
                                aria-label={`Prix unitaire ligne ${index + 1}`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setLines((prev) =>
                            prev.length === 1 ? [emptyLine()] : prev.filter((l) => l.key !== line.key)
                          )
                        }
                        className="mt-1 grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Supprimer la ligne ${index + 1}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    {!isBL && (
                      <p className="mt-2 text-right text-[12px] font-semibold text-slate-600">
                        {(Number(line.quantity) || 0) * (Number(line.unitPrice) || 0)
                          ? amount((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0))
                          : "0"}{" "}
                        FCFA
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
                className="btn mt-3 w-full border border-dashed border-brand-300 bg-brand-50/50 text-[14px] text-brand-700 hover:bg-brand-50"
              >
                <Plus className="size-4" /> Ajouter une ligne
              </button>

              {!isBL && (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-canvas px-3.5 py-3">
                  <span className="text-[13px] font-semibold text-slate-600">Sous-total</span>
                  <span className="text-[18px] font-extrabold text-brand-700">
                    {amount(totals.subtotal)} FCFA
                  </span>
                </div>
              )}
            </section>
          )}

          {step === 3 && (
            <>
              {!isBL && (
                <section className="card p-4">
                  <h2 className="text-[15px] font-bold">Remise et TVA</h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="discount">
                        Remise (%)
                      </label>
                      <input
                        id="discount"
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(e.target.value)}
                        className="field"
                      />
                    </div>
                    <div>
                      <span className="label">TVA</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 0 as const, label: "Non applicable" },
                          { value: 18 as const, label: "18 %" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setVatPercent(option.value)}
                            className={clsx(
                              "min-h-12 rounded-xl border px-2 text-[13px] font-semibold transition",
                              vatPercent === option.value
                                ? "border-brand-500 bg-brand-50 text-brand-700"
                                : "border-black/10 bg-white text-slate-600 hover:bg-black/[0.02]"
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="dueDate">
                        Date d&apos;échéance
                      </label>
                      <input
                        id="dueDate"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="field"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="w-full rounded-xl bg-canvas px-3.5 py-2.5">
                        <p className="text-[11.5px] font-medium text-slate-500">Total à payer</p>
                        <p className="text-[17px] font-extrabold text-brand-700">
                          {amount(totals.total)} FCFA
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              <section className="card p-4">
                <h2 className="text-[15px] font-bold">Moyens de paiement acceptés</h2>
                <p className="hint">Ils apparaîtront sur le document et dans le message WhatsApp.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((method) => {
                    const selected = paymentMethods.includes(method);
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() =>
                          setPaymentMethods((prev) =>
                            selected ? prev.filter((m) => m !== method) : [...prev, method]
                          )
                        }
                        className={clsx(
                          "min-h-10 rounded-full border px-3.5 text-[13px] font-semibold transition",
                          selected
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-black/10 bg-white text-slate-600 hover:bg-black/[0.02]"
                        )}
                        aria-pressed={selected}
                      >
                        {method}
                      </button>
                    );
                  })}
                </div>

                {paymentMethods.some((m) => MOBILE_MONEY_METHODS.includes(m as never)) && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {paymentMethods
                      .filter((m) => MOBILE_MONEY_METHODS.includes(m as never))
                      .map((method) => {
                        const key = numberKeyOf(method) as keyof typeof numbers;
                        return (
                          <div key={method}>
                            <label className="label" htmlFor={`num-${key}`}>
                              Numéro {method}
                            </label>
                            <input
                              id={`num-${key}`}
                              value={numbers[key]}
                              onChange={(e) =>
                                setNumbers((prev) => ({ ...prev, [key]: e.target.value }))
                              }
                              placeholder="07 00 00 00 00"
                              className="field"
                            />
                            <p className="hint">Mémorisé dans votre profil d&apos;entreprise.</p>
                          </div>
                        );
                      })}
                  </div>
                )}
              </section>

              {!isBL && (
                <section className="card p-4">
                  <h2 className="text-[15px] font-bold">Paiement en tranches</h2>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => regeneratePlan(count, count === 1 ? "" : deposit)}
                        className={clsx(
                          "min-h-10 min-w-11 rounded-xl border px-3 text-[13px] font-semibold",
                          installmentCount === count
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-black/10 bg-white text-slate-600 hover:bg-black/[0.02]"
                        )}
                      >
                        {count === 1 ? "Comptant" : count}
                      </button>
                    ))}
                  </div>

                  {installmentCount > 1 && (
                    <div className="mt-3">
                      <label className="label" htmlFor="deposit">
                        Premier versement (acompte)
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="deposit"
                          type="number"
                          min="0"
                          max={totals.total}
                          step="100"
                          value={deposit}
                          onChange={(e) => regeneratePlan(installmentCount, e.target.value)}
                          placeholder="20000"
                          className="field"
                        />
                        <button
                          type="button"
                          onClick={() => regeneratePlan(installmentCount, String(Math.round(totals.total * 0.3)))}
                          className="btn shrink-0 border border-black/10 bg-white px-3 text-[12.5px]"
                        >
                          30 %
                        </button>
                      </div>
                      <p className="hint">
                        Le reste est réparti à parts égales (arrondies à 100 FCFA), la dernière tranche
                        absorbe la différence.
                      </p>
                    </div>
                  )}

                  <ul className="mt-3 space-y-2">
                    {plan.map((item, index) => (
                      <li key={index} className="rounded-xl border border-black/5 p-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-24 shrink-0 truncate text-[12.5px] font-semibold text-slate-600">
                            {item.label}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={item.amount}
                            onChange={(e) =>
                              setCustomPlan(
                                plan.map((p, i) =>
                                  i === index ? { ...p, amount: e.target.value } : p
                                )
                              )
                            }
                            className="field flex-1 py-2 text-right text-[13px]"
                            aria-label={`Montant ${item.label}`}
                          />
                          <input
                            type="date"
                            value={item.dueDate ?? ""}
                            onChange={(e) =>
                              setCustomPlan(
                                plan.map((p, i) =>
                                  i === index ? { ...p, dueDate: e.target.value } : p
                                )
                              )
                            }
                            className="field w-[140px] shrink-0 py-2 text-[12.5px]"
                            aria-label={`Échéance ${item.label}`}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div
                    className={clsx(
                      "mt-2 flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] font-semibold",
                      planValid ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-700"
                    )}
                  >
                    <span>Somme des tranches</span>
                    <span>
                      {amount(planSum)} / {amount(totals.total)} FCFA{" "}
                      {planValid ? "✓" : "✗"}
                    </span>
                  </div>
                </section>
              )}

              <section className="card p-4">
                <label className="label" htmlFor="note">
                  Note ou conditions
                </label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Délai de livraison, conditions particulières…"
                  className="field resize-none"
                />
              </section>
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="btn border border-black/10 bg-white text-slate-700"
              >
                <ArrowLeft className="size-4" /> Retour
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="btn flex-1 bg-brand-500 text-white hover:bg-brand-600"
              >
                Continuer <ArrowRight className="size-4" />
              </button>
            ) : (
              <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => submit("save")}
                  disabled={pending}
                  className="btn flex-1 bg-brand-500 text-white hover:bg-brand-600"
                >
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Enregistrer le document
                </button>
                <button
                  type="button"
                  onClick={() => submit("pdf")}
                  disabled={pending}
                  className="btn border border-black/10 bg-white text-slate-700"
                >
                  <FileDown className="size-4" /> PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Aperçu */}
        <div className="lg:sticky lg:top-16 lg:self-start">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-400">
              Aperçu
            </h2>
            <button
              type="button"
              onClick={() => setShowPreviewMobile((v) => !v)}
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-600 lg:hidden"
            >
              {showPreviewMobile ? "Masquer" : "Afficher"}
              <ChevronDown
                className={clsx("size-4 transition", showPreviewMobile && "rotate-180")}
              />
            </button>
          </div>
          <div className={clsx(showPreviewMobile ? "block" : "hidden", "lg:block")}>
            <div className="max-h-[70vh] overflow-auto rounded-xl bg-canvas p-2 lg:max-h-[calc(100vh-9rem)]">
              <DocumentPreview doc={preview} compact showWatermark={showWatermark} />
            </div>
            {!isBL && (
              <p className="mt-2 text-center text-[11.5px] font-medium text-slate-500">
                {amountInWords(totals.total)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function numberKeyOf(method: string): string {
  switch (method) {
    case "Wave":
      return "wave";
    case "Orange Money":
      return "orange";
    case "MTN Money":
      return "mtn";
    case "Moov Money":
      return "moov";
    default:
      return "";
  }
}

export function DeliveryIcon() {
  return <Truck className="size-4" />;
}

export function LogoBadge({ logo, name }: { logo: string | null; name: string }) {
  if (logo) {
    return (
      <Image src={logo} alt="" width={40} height={40} unoptimized className="rounded object-contain" />
    );
  }
  return (
    <span className="grid size-10 place-items-center rounded bg-brand-500 text-[11px] font-black text-white">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
