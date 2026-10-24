/**
 * Définition des plans — module pur, utilisable côté client comme côté serveur.
 */

export type PlanId = "free" | "pro" | "business";

export type PlanDefinition = {
  id: PlanId;
  label: string;
  price: number; // FCFA / mois
  documentsPerMonth: number | null;
  features: string[];
  badge?: string;
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    label: "Gratuit",
    price: 0,
    documentsPerMonth: 5,
    features: [
      "5 documents par mois",
      "1 utilisateur",
      "Factures, devis et bons de livraison",
      "PDF avec la mention « Créé avec FactureCI »",
    ],
  },
  pro: {
    id: "pro",
    label: "Pro",
    price: 4_900,
    documentsPerMonth: null,
    badge: "Le plus choisi",
    features: [
      "Documents illimités",
      "Votre logo sur les documents",
      "PDF sans mention FactureCI",
      "Envoi par e-mail",
      "Tableau de bord complet",
      "Relances WhatsApp",
    ],
  },
  business: {
    id: "business",
    label: "Business",
    price: 9_900,
    documentsPerMonth: null,
    features: [
      "Tout le plan Pro",
      "Export CSV pour le comptable",
      "Carnet de clients illimité",
      "Jusqu'à 3 utilisateurs sur la même entreprise",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "pro", "business"];

export function isPaidPlan(plan: string): boolean {
  return plan === "pro" || plan === "business";
}

/** Libellé court d'un plan pour l'interface. */
export function planLabel(plan: string): string {
  return PLANS[(plan as PlanId) in PLANS ? (plan as PlanId) : "free"].label;
}
