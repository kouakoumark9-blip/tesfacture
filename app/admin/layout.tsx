import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { ShieldCheck } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Administration — TesFacture" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-slate-900 text-[12px] font-black text-white">
              TF
            </span>
            <span className="text-[15px] font-extrabold tracking-tight">
              Tes<span className="text-accent-500">Facture</span>
            </span>
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10.5px] font-bold text-white">
              <ShieldCheck className="size-3" /> Admin
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/app"
              className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-slate-600 hover:bg-black/5"
            >
              Mon espace
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
    </div>
  );
}
