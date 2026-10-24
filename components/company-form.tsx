"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { Building2, Camera, Loader2, Trash2 } from "lucide-react";
import type { Company } from "@/db/schema";
import { saveCompanyAction, type CompanyState } from "@/lib/actions/company";
import { Alert, FieldError, SubmitButton } from "./ui";

const initial: CompanyState = { ok: false };

const MOBILE_MONEY = [
  { key: "wave", label: "Wave", placeholder: "07 00 00 00 00" },
  { key: "orange", label: "Orange Money", placeholder: "#144*1*..." },
  { key: "mtn", label: "MTN Money", placeholder: "05 00 00 00 00" },
  { key: "moov", label: "Moov Money", placeholder: "01 00 00 00 00" },
] as const;

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_MAX_SIZE = 240;

export function CompanyForm({
  company,
  welcome = false,
}: {
  company: Company | null;
  welcome?: boolean;
}) {
  const [state, action, pending] = useActionState(saveCompanyAction, initial);
  const [logo, setLogo] = useState<string>(company?.logo ?? "");
  const [logoError, setLogoError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleLogo(file: File) {
    setLogoError(null);

    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setLogoError("Format non accepté. Utilisez une image PNG, JPG ou WEBP.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("Image trop lourde (2 Mo maximum avant redimensionnement).");
      return;
    }

    setProcessing(true);
    try {
      const resized = await resizeImage(file, LOGO_MAX_SIZE);
      setLogo(resized);
    } catch {
      setLogoError("Impossible de lire cette image. Essayez-en une autre.");
    } finally {
      setProcessing(false);
    }
  }

  const numbers = (company?.paymentNumbers ?? {}) as Record<string, string | undefined>;

  return (
    <form action={action} className="space-y-4">
      {welcome && (
        <div className="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3.5">
          <p className="text-[14px] font-bold text-accent-800">Bienvenue sur FactureCI 🎉</p>
          <p className="mt-0.5 text-[13px] text-accent-800/80">
            Renseignez le nom de votre entreprise : il apparaîtra sur toutes vos factures.
          </p>
        </div>
      )}

      {state.error && <Alert>{state.error}</Alert>}
      {state.message && <Alert tone="success">{state.message}</Alert>}

      <input type="hidden" name="logo" value={logo} />

      <section className="card p-4">
        <h2 className="text-[15px] font-bold">Identité</h2>

        <div className="mt-4 flex items-center gap-4">
          <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-black/10 bg-canvas">
            {logo ? (
              <Image src={logo} alt="Logo de l'entreprise" width={80} height={80} unoptimized className="size-full object-contain" />
            ) : (
              <Building2 className="size-7 text-slate-300" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="btn min-h-10 border border-black/10 bg-white px-3 text-[13px]"
                disabled={processing}
              >
                {processing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
                {logo ? "Changer le logo" : "Ajouter un logo"}
              </button>
              {logo && (
                <button
                  type="button"
                  onClick={() => setLogo("")}
                  className="btn min-h-10 px-3 text-[13px] text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="size-4" /> Retirer
                </button>
              )}
            </div>
            <p className="mt-1.5 text-[11.5px] text-slate-500">
              PNG ou JPG, 2 Mo max. Redimensionné automatiquement à 240 px.
            </p>
            <FieldError>{logoError}</FieldError>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleLogo(file);
              e.target.value = "";
            }}
          />
        </div>

        <div className="mt-4">
          <label className="label" htmlFor="name">
            Nom de l&apos;entreprise *
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={company?.name ?? ""}
            placeholder="Krea Ecom"
            className="field"
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
          <FieldError>{state.fieldErrors?.name}</FieldError>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="rccm">
              RCCM
            </label>
            <input
              id="rccm"
              name="rccm"
              defaultValue={company?.rccm ?? ""}
              placeholder="CI-ABJ-2024-B-14582"
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="taxNumber">
              Compte contribuable
            </label>
            <input
              id="taxNumber"
              name="taxNumber"
              defaultValue={company?.taxNumber ?? ""}
              placeholder="CI-2024-884512-A"
              className="field"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="label" htmlFor="address">
            Adresse
          </label>
          <textarea
            id="address"
            name="address"
            rows={2}
            defaultValue={company?.address ?? ""}
            placeholder="Cocody Angré, 8e tranche, Abidjan"
            className="field resize-none"
          />
        </div>

        <div className="mt-4">
          <label className="label" htmlFor="phone">
            Téléphone de l&apos;entreprise
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={company?.phone ?? ""}
            placeholder="27 22 45 12 90"
            className="field"
          />
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-[15px] font-bold">Numéros Mobile Money</h2>
        <p className="hint">
          Ils apparaissent sur vos factures pour que vos clients puissent payer facilement.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {MOBILE_MONEY.map((m) => (
            <div key={m.key}>
              <label className="label" htmlFor={m.key}>
                {m.label}
              </label>
              <input
                id={m.key}
                name={m.key}
                defaultValue={numbers[m.key] ?? ""}
                placeholder={m.placeholder}
                className="field"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <label className="label" htmlFor="defaultNote">
          Note par défaut sur les documents
        </label>
        <textarea
          id="defaultNote"
          name="defaultNote"
          rows={3}
          defaultValue={company?.defaultNote ?? ""}
          placeholder="Merci de votre confiance. Livraison sous 48 h après règlement."
          className="field resize-none"
        />
        <p className="hint">Vous pourrez la modifier sur chaque document.</p>
      </section>

      <SubmitButton pending={pending} className="w-full">
        Enregistrer
      </SubmitButton>
    </form>
  );
}

/** Redimensionne une image côté client (canvas) et renvoie une data URL. */
async function resizeImage(file: File, maxSize: number): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = document.createElement("img");
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/png");
}
