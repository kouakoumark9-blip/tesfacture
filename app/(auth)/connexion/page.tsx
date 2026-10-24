import Link from "next/link";
import { LoginForm } from "@/components/auth-forms";

export const metadata = { title: "Connexion — TesFacture" };

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ suivant?: string; message?: string }>;
}) {
  const { suivant, message } = await searchParams;

  return (
    <div className="rise">
      <h1 className="text-[26px] font-extrabold tracking-tight">Bon retour 👋</h1>
      <p className="mt-1 text-[14px] text-slate-600">
        Connectez-vous avec votre numéro de téléphone.
      </p>

      {message && (
        <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-3 text-[13.5px] font-medium text-brand-800">
          {message}
        </div>
      )}

      <div className="mt-6">
        <LoginForm next={suivant} />
      </div>

      <p className="mt-6 text-center text-[13.5px] text-slate-600">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-brand-600 hover:underline">
          Créer un compte gratuit
        </Link>
      </p>

      <p className="mt-4 text-center text-[12px] text-slate-400">
        Mot de passe oublié ? Contactez l&apos;administrateur pour le réinitialiser.
      </p>
    </div>
  );
}
