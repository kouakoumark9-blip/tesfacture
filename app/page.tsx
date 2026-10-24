import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileText,
  MessageCircle,
  Layers,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Facture en 3 étapes",
    text: "Client, lignes, conditions. Le numéro FAC-2026-001 est généré automatiquement.",
  },
  {
    icon: Layers,
    title: "Paiement en tranches",
    text: "Acompte puis tranches égales, chaque versement marqué payé avec sa date et son moyen.",
  },
  {
    icon: MessageCircle,
    title: "Envoi WhatsApp",
    text: "Un message prêt à envoyer avec le montant, les tranches et les numéros Mobile Money.",
  },
  {
    icon: Wallet,
    title: "Mobile Money",
    text: "Wave, Orange Money, MTN, Moov : vos numéros apparaissent directement sur le document.",
  },
  {
    icon: ShieldCheck,
    title: "Montant en lettres",
    text: "« Arrêté à la somme de… » calculé automatiquement, sans faute, sur chaque facture.",
  },
  {
    icon: Smartphone,
    title: "Pensé pour le téléphone",
    text: "Installable comme une application, utilisable même avec une connexion capricieuse.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-500 text-[13px] font-black text-white">
              TF
            </span>
            <span className="text-[17px] font-extrabold tracking-tight">
              Tes<span className="text-accent-500">Facture</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link href="/connexion" className="btn btn-ghost min-h-10 px-4 text-[14px]">
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="btn min-h-10 bg-brand-500 px-4 text-[14px] text-white hover:bg-brand-600"
            >
              Essayer gratuitement
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-[12.5px] font-semibold text-brand-700">
                <span className="size-1.5 rounded-full bg-accent-500" />
                Fait pour les PME ivoiriennes
              </span>
              <h1 className="mt-4 text-[34px] font-extrabold leading-[1.1] tracking-tight sm:text-[46px]">
                Vos factures en FCFA,
                <br />
                prêtes en 2 minutes.
              </h1>
              <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-slate-600">
                TesFacture crée vos factures, devis et bons de livraison depuis votre téléphone.
                Paiement en tranches, montant en lettres, envoi WhatsApp, PDF professionnel.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/inscription"
                  className="btn bg-brand-500 text-white shadow-sm hover:bg-brand-600"
                >
                  Créer mon compte gratuit <ArrowRight className="size-4" />
                </Link>
                <Link href="/connexion" className="btn border border-black/10 bg-white">
                  J&apos;ai déjà un compte
                </Link>
              </div>

              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-slate-600">
                {["5 documents gratuits par mois", "Sans carte bancaire", "Données privées"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <Check className="size-4 text-brand-500" />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-xl shadow-black/5">
                <div className="flex items-start justify-between border-b border-black/5 pb-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Facture
                    </p>
                    <p className="text-[16px] font-extrabold">FAC-2026-001</p>
                    <p className="text-[12px] text-slate-500">24/10/2026</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">
                    Acompte payé
                  </span>
                </div>

                <div className="space-y-2 border-b border-black/5 py-4 text-[12.5px]">
                  {[
                    ["Création de site web", "45 000"],
                    ["Nom de domaine (1 an)", "15 000"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 py-4 text-[12.5px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Sous-total</span>
                    <span>60 000</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>TVA 18 %</span>
                    <span>10 800</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-[13px] font-bold">Total TTC</span>
                    <span className="text-[19px] font-extrabold text-brand-600">70 800 FCFA</span>
                  </div>
                </div>

                <div className="rounded-xl bg-canvas p-3">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">
                    Tranches
                  </p>
                  <div className="mt-2 space-y-1.5 text-[12px]">
                    {[
                      ["Acompte", "20 000", true],
                      ["Tranche 2", "16 900", false],
                      ["Tranche 3", "16 900", false],
                      ["Solde", "17 000", false],
                    ].map(([label, value, paid]) => (
                      <div key={label as string} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <span
                            className={`size-1.5 rounded-full ${paid ? "bg-brand-500" : "bg-slate-300"}`}
                          />
                          {label as string}
                        </span>
                        <span className="font-semibold">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-brand-100 via-transparent to-accent-100 blur-2xl" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-[24px] font-extrabold tracking-tight">
            Tout ce qu&apos;il faut pour être payé à temps
          </h2>
          <p className="mt-1 text-[14.5px] text-slate-600">
            Conçu avec des artisans, commerçants et prestataires de services d&apos;Abidjan.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="card p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-3 text-[15px] font-bold">{f.title}</h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="rounded-2xl bg-brand-500 p-7 text-white sm:p-10">
            <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-[22px] font-extrabold sm:text-[26px]">
                  Gratuit jusqu&apos;à 5 documents par mois
                </h2>
                <p className="mt-1.5 text-[14.5px] text-brand-100">
                  Passez au plan Pro à 4 900 FCFA par mois quand vous en avez besoin.
                </p>
              </div>
              <Link
                href="/inscription"
                className="btn shrink-0 bg-white text-brand-700 hover:bg-brand-50"
              >
                Commencer <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-[12.5px] text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} TesFacture · Abidjan, Côte d&apos;Ivoire</p>
          <p>Montants en FCFA · Fuseau Africa/Abidjan</p>
        </div>
      </footer>
    </div>
  );
}
