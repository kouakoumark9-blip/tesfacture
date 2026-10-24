import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui";
import ClientForm from "@/components/ClientForm";

export const dynamic = "force-dynamic";

export default function NouveauClientPage() {
  return (
    <div className="space-y-5">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-3.5" /> Retour aux clients
      </Link>
      <PageHeader
        title="Nouveau client"
        subtitle="Renseignez les coordonnées qui apparaîtront sur vos documents."
      />
      <div className="max-w-3xl">
        <ClientForm />
      </div>
    </div>
  );
}
