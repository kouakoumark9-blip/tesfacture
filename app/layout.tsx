import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tesfacture — Facturation simple pour les entreprises ivoiriennes",
  description:
    "Créez vos factures et devis en quelques secondes, suivez vos encaissements et exportez en PDF. FCFA, TVA 18 %, pensé pour l'Afrique de l'Ouest.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
