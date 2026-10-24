"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  FileText,
  FileSignature,
  Home,
  LogOut,
  Menu,
  PackageCheck,
  Settings,
  Truck,
  Users,
  X,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";
import { logoutAction } from "@/lib/actions/auth";

const nav: { href: string; label: string; icon: typeof Home; exact?: boolean }[] = [
  { href: "/app", label: "Accueil", icon: Home, exact: true },
  { href: "/app/factures", label: "Factures", icon: FileText },
  { href: "/app/devis", label: "Devis", icon: FileSignature },
  { href: "/app/livraisons", label: "Livraisons", icon: Truck },
  { href: "/app/clients", label: "Clients", icon: Users },
];

const secondaryNav: { href: string; label: string; icon: typeof Home; exact?: boolean }[] = [
  { href: "/app/profil-entreprise", label: "Mon entreprise", icon: Settings },
];

const planLabels: Record<string, string> = {
  free: "Gratuit",
  pro: "Pro",
  business: "Business",
};

export function AppHeader({
  name,
  plan,
  role,
  companyName,
}: {
  name: string;
  plan: string;
  role: string;
  companyName: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-canvas/90 backdrop-blur no-print">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/app" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-brand-500 text-[12px] font-black text-white">
            FC
          </span>
          <span className="text-[15px] font-extrabold tracking-tight">
            Facture<span className="text-accent-500">CI</span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <span
            className={clsx(
              "rounded-full px-2.5 py-1 text-[11px] font-bold",
              plan === "free" ? "bg-slate-100 text-slate-600" : "bg-accent-100 text-accent-700"
            )}
          >
            {planLabels[plan] ?? plan}
          </span>
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-xl text-slate-600 hover:bg-black/5"
            aria-label="Menu du compte"
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-auto max-w-5xl px-4 pb-3">
          <div className="card p-2 rise">
            <div className="px-3 py-2">
              <p className="text-[13.5px] font-bold">{companyName || name}</p>
              <p className="text-[12px] text-slate-500">
                {companyName ? name : "Complétez votre profil d'entreprise"}
              </p>
            </div>
            <div className="my-1 h-px bg-black/5" />
            {[...nav, ...secondaryNav].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-slate-700 hover:bg-black/[0.04]"
              >
                <item.icon className="size-4 text-slate-400" />
                {item.label}
              </Link>
            ))}
            <Link
              href="/app/abonnement"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-accent-700 hover:bg-accent-50"
            >
              <Sparkles className="size-4" /> Mon abonnement
            </Link>
            {role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-slate-700 hover:bg-black/[0.04]"
              >
                <PackageCheck className="size-4 text-slate-400" /> Administration
              </Link>
            )}
            <div className="my-1 h-px bg-black/5" />
            <button
              onClick={() => startTransition(() => logoutAction())}
              disabled={pending}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="size-4" /> Se déconnecter
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden no-print"
      aria-label="Navigation principale"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={clsx(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[10.5px] font-semibold",
                  active ? "text-brand-600" : "text-slate-400"
                )}
                aria-current={active ? "page" : undefined}
              >
                <item.icon className="size-5" strokeWidth={active ? 2.4 : 2} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppSidebar({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-black/5 md:block no-print">
      <div className="sticky top-14 space-y-1 p-3">
        {[...nav, ...secondaryNav].map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-black/[0.04]"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/app/abonnement"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-accent-700 hover:bg-accent-50"
        >
          <Sparkles className="size-4" /> Mon abonnement
        </Link>
        {role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-slate-600 hover:bg-black/[0.04]"
          >
            <PackageCheck className="size-4" /> Administration
          </Link>
        )}
      </div>
    </aside>
  );
}
