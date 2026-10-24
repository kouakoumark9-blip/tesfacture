/**
 * Règles de calcul des documents — fonctions pures, testées (lib/calc.test.ts).
 * Tous les montants sont en FCFA entiers (arrondis).
 */

export type CalcLine = { quantity: number; unitPrice: number };

export type DocTotals = {
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  total: number;
};

export function lineTotal(line: CalcLine): number {
  const qty = Number(line.quantity) || 0;
  const price = Number(line.unitPrice) || 0;
  return Math.round(qty * price);
}

export function computeTotals(input: {
  lines: CalcLine[];
  discountPercent?: number;
  vatPercent?: number;
}): DocTotals {
  const subtotal = input.lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const discountPercent = clamp(Number(input.discountPercent) || 0, 0, 100);
  const vatPercent = clamp(Number(input.vatPercent) || 0, 0, 100);

  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const taxable = subtotal - discountAmount;
  const vatAmount = Math.round((taxable * vatPercent) / 100);

  return {
    subtotal,
    discountAmount,
    vatAmount,
    total: taxable + vatAmount,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export type InstallmentPlan = {
  position: number;
  label: string;
  amount: number;
};

/**
 * Répartit un total en `count` tranches :
 * le premier versement (acompte) est saisi, le reste est divisé à parts égales
 * arrondies à 100 FCFA vers le bas ; la dernière tranche absorbe la différence.
 *
 * Exemple : total 60 000, acompte 20 000, 4 tranches
 *   -> 20 000 / 13 300 / 13 300 / 13 400
 */
export function buildInstallments(
  total: number,
  count: number,
  deposit: number | null | undefined
): InstallmentPlan[] {
  const safeTotal = Math.max(0, Math.round(total));
  const safeCount = clamp(Math.round(count) || 1, 1, 6);

  if (safeCount === 1) {
    return [{ position: 0, label: "Paiement comptant", amount: safeTotal }];
  }

  const first = clamp(Math.round(Number(deposit) || 0), 0, safeTotal);
  const remaining = safeTotal - first;
  const parts = safeCount - 1;
  const perPart = Math.floor(remaining / parts / 100) * 100;
  const last = remaining - perPart * (parts - 1);

  const plan: InstallmentPlan[] = [
    { position: 0, label: "Acompte", amount: first },
  ];

  for (let i = 1; i < safeCount; i++) {
    const isLast = i === safeCount - 1;
    plan.push({
      position: i,
      label: isLast ? "Solde" : `Tranche ${i + 1}`,
      amount: isLast ? last : perPart,
    });
  }

  return plan;
}

/** Vérifie que la somme des tranches correspond bien au total. */
export function installmentsSum(installments: { amount: number }[]): number {
  return installments.reduce((sum, item) => sum + Math.round(Number(item.amount) || 0), 0);
}

export function installmentsValid(
  installments: { amount: number }[],
  total: number
): boolean {
  return Math.abs(installmentsSum(installments) - Math.round(total)) < 0.01;
}

export type PayableInstallment = { amount: number; dueDate?: string | null; paidAt?: Date | string | null };

export type DocStatus = "draft" | "sent" | "partial" | "paid" | "overdue" | "cancelled" | "delivered";

/**
 * Statut calculé automatiquement :
 * - payé si toutes les tranches sont réglées ;
 * - en retard si une échéance est dépassée et non payée ;
 * - partiel si au moins une tranche est réglée ;
 * - sinon le statut courant (envoyé, brouillon…).
 */
export function computeStatus(
  current: DocStatus,
  installments: PayableInstallment[],
  todayISO: string
): DocStatus {
  if (current === "cancelled" || current === "draft" || current === "delivered") return current;
  if (installments.length === 0) return current;

  const allPaid = installments.every((item) => Boolean(item.paidAt));
  if (allPaid) return "paid";

  const hasOverdue = installments.some(
    (item) => !item.paidAt && item.dueDate && item.dueDate < todayISO
  );
  if (hasOverdue) return "overdue";

  const anyPaid = installments.some((item) => Boolean(item.paidAt));
  if (anyPaid) return "partial";

  return current === "paid" ? "sent" : current;
}

/** Montant restant à encaisser. */
export function remainingAmount(installments: PayableInstallment[]): number {
  return installments
    .filter((item) => !item.paidAt)
    .reduce((sum, item) => sum + Math.round(Number(item.amount) || 0), 0);
}

export type PaymentMethod =
  | "Wave"
  | "Orange Money"
  | "MTN Money"
  | "Moov Money"
  | "Espèces"
  | "Virement"
  | "Chèque";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Wave",
  "Orange Money",
  "MTN Money",
  "Moov Money",
  "Espèces",
  "Virement",
  "Chèque",
];

export const MOBILE_MONEY_METHODS: PaymentMethod[] = [
  "Wave",
  "Orange Money",
  "MTN Money",
  "Moov Money",
];

export function isMobileMoney(method: string): boolean {
  return MOBILE_MONEY_METHODS.includes(method as PaymentMethod);
}

/** Clé du numéro Mobile Money dans companies.payment_numbers */
export function paymentNumberKey(method: string): "wave" | "orange" | "mtn" | "moov" | null {
  switch (method) {
    case "Wave":
      return "wave";
    case "Orange Money":
      return "orange";
    case "MTN Money":
      return "mtn";
    case "Moov Money":
      return "moov";
    default:
      return null;
  }
}
