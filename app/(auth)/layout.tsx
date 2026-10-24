import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-4 pt-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-500 text-[13px] font-black text-white">
            FC
          </span>
          <span className="text-[17px] font-extrabold tracking-tight">
            Facture<span className="text-accent-500">CI</span>
          </span>
        </Link>
        <Link href="/" className="text-[13px] font-semibold text-slate-500 hover:text-slate-800">
          Accueil
        </Link>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">{children}</main>

      <footer className="pb-6 text-center text-[11.5px] text-slate-400">
        Montants en FCFA · Africa/Abidjan
      </footer>
    </div>
  );
}
