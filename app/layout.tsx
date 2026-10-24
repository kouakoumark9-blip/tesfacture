import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FactureCI — Factures, devis et bons de livraison en FCFA",
  description:
    "FactureCI aide les PME, artisans et freelances de Côte d'Ivoire à créer factures, devis et bons de livraison en FCFA, avec paiement en tranches et envoi WhatsApp.",
  applicationName: "FactureCI",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "FactureCI" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F8F4" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1410" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
