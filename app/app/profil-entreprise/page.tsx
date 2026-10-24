import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getCompany } from "@/lib/actions/company";
import { CompanyForm } from "@/components/company-form";

export const metadata = { title: "Mon entreprise — TesFacture" };
export const dynamic = "force-dynamic";

export default async function ProfilEntreprisePage({
  searchParams,
}: {
  searchParams: Promise<{ bienvenue?: string }>;
}) {
  const user = await requireUser();
  const company = await getCompany(user.id);
  const { bienvenue } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" /> Accueil
      </Link>

      <div className="mt-3 mb-4">
        <h1 className="text-[24px] font-extrabold tracking-tight">Mon entreprise</h1>
        <p className="mt-0.5 text-[13.5px] text-slate-600">
          Ces informations apparaissent sur vos factures, devis et bons de livraison.
        </p>
      </div>

      <CompanyForm company={company} welcome={bienvenue === "1"} />
    </div>
  );
}
