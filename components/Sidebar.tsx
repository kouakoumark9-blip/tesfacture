"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FileSignature,
  Users,
  Settings,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { clsx } from "clsx";

const items = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/factures", label: "Factures", icon: FileText },
  { href: "/devis", label: "Devis", icon: FileSignature },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-black text-white shadow-lg shadow-brand-600/25">
        TF
      </span>
      {!compact && (
        <span className="text-[17px] font-extrabold tracking-tight text-slate-900">
          tes<span className="text-brand-600">facture</span>
        </span>
      )}
    </span>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({
  companyName,
  companyCity,
  pendingCount,
}: {
  companyName: string;
  companyCity: string;
  pendingCount: number;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Barre latérale desktop */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-[72px] items-center px-6">
          <Link href="/dashboard" aria-label="Accueil tesfacture">
            <Logo />
          </Link>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon
                  className={clsx(
                    "size-[18px]",
                    active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
                  )}
                  strokeWidth={2}
                />
                <span className="flex-1">{item.label}</span>
                {item.href === "/factures" && pendingCount > 0 && (
                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3">
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white">
            <div className="flex items-center gap-2 text-[13px] font-semibold">
              <Sparkles className="size-4 text-amber-300" />
              Astuce du jour
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-300">
              Convertissez un devis accepté en facture en un clic, sans ressaisie.
            </p>
            <Link
              href="/devis"
              className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-white/90 hover:text-white"
            >
              Voir mes devis <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
              {companyName.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-slate-800">{companyName}</p>
              <p className="truncate text-[11.5px] text-slate-500">{companyCity}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* En-tête mobile */}
      <div className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {companyCity}
          </span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium transition",
                  active ? "bg-brand-50 text-brand-700" : "text-slate-500"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
