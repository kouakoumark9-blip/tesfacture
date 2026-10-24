import Link from "next/link";
import { CloudOff, RefreshCw } from "lucide-react";

export const metadata = { title: "Hors connexion — FactureCI" };

export default function OfflinePage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-black/5">
          <CloudOff className="size-6" />
        </span>
        <h1 className="mt-4 text-[20px] font-extrabold tracking-tight">Vous êtes hors connexion</h1>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-600">
          FactureCI a besoin du réseau pour enregistrer un document. Vos brouillons sont conservés
          sur l&apos;appareil et seront envoyés automatiquement dès le retour de la connexion.
        </p>
        <Link href="/app" className="btn mt-5 w-full bg-brand-500 text-white hover:bg-brand-600">
          <RefreshCw className="size-4" /> Réessayer
        </Link>
        <p className="mt-3 text-[11.5px] text-slate-400">Les pages déjà consultées restent accessibles.</p>
      </div>
    </div>
  );
}
