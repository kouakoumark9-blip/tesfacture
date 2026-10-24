import Link from "next/link";
import { RegisterForm } from "@/components/auth-forms";

export const metadata = { title: "Créer un compte — TesFacture" };

export default function InscriptionPage() {
  return (
    <div className="rise">
      <h1 className="text-[26px] font-extrabold tracking-tight">Créer votre compte</h1>
      <p className="mt-1 text-[14px] text-slate-600">
        Gratuit. 5 documents par mois, sans carte bancaire.
      </p>

      <div className="mt-6">
        <RegisterForm />
      </div>

      <p className="mt-6 text-center text-[13.5px] text-slate-600">
        Vous avez déjà un compte ?{" "}
        <Link href="/connexion" className="font-semibold text-brand-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
