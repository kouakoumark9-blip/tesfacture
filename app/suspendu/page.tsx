import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export const metadata = { title: "Compte suspendu — FactureCI" };

export default function SuspenduPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-500">
          <ShieldOff className="size-6" />
        </span>
        <h1 className="mt-4 text-[20px] font-extrabold tracking-tight">Compte suspendu</h1>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-600">
          Votre accès est temporairement suspendu. Vos données sont conservées. Contactez
          l&apos;administrateur FactureCI pour réactiver votre compte.
        </p>
        <div className="mt-5 space-y-2">
          <Link href="/" className="btn w-full border border-black/10 bg-white text-slate-700">
            Retour à l&apos;accueil
          </Link>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
