/**
 * Couche d'envoi d'e-mail isolée.
 *
 * Aujourd'hui : l'application utilise des liens `mailto:` (aucune clé requise).
 * Demain : brancher Resend en remplissant RESEND_API_KEY et en activant la
 * fonction `sendDocumentEmail` ci-dessous — aucun autre fichier à modifier.
 */
import type { PreviewDoc } from "./preview";
import { documentMessage, publicLink } from "./share";

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fallback: "mailto" };

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

/** Sujet de l'e-mail envoyé au client. */
export function documentSubject(doc: PreviewDoc): string {
  const label = doc.type === "FAC" ? "Facture" : doc.type === "DEV" ? "Devis" : "Bon de livraison";
  return `${label} ${doc.number} — ${doc.company.name}`;
}

/** Corps texte (réutilisé pour mailto et pour le futur envoi API). */
export function documentBody(doc: PreviewDoc, appUrl?: string): string {
  return documentMessage(doc, publicLink(doc.shareToken, appUrl));
}

export async function sendDocumentEmail(input: {
  to: string | null;
  doc: PreviewDoc;
  pdfUrl: string;
  appUrl?: string;
}): Promise<SendResult> {
  if (!input.to) {
    return { ok: false, error: "Ce client n'a pas d'adresse e-mail.", fallback: "mailto" };
  }

  if (!emailConfigured()) {
    // Mode actuel : le client de messagerie de l'utilisateur prend le relais.
    return {
      ok: false,
      error:
        "L'envoi automatique n'est pas encore activé (RESEND_API_KEY manquante). Utilisez le lien e-mail.",
      fallback: "mailto",
    };
  }

  // Intégration Resend prête à l'emploi :
  // const { Resend } = await import("resend");
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // const result = await resend.emails.send({...});
  return {
    ok: false,
    error: "Envoi automatique non implémenté dans cette version.",
    fallback: "mailto",
  };
}
