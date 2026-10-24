import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  clients,
  documentItems,
  documents,
  installments,
} from "@/db/schema";
import { newShareToken, nextNumber } from "./documents";
import { computeTotals } from "./calc";
import { PLANS, type PlanId } from "./plan";
import { addDaysISO, todayISO } from "./format";

/**
 * Génère la facture d'abonnement dans le compte de l'administrateur
 * (le moteur de documents est réutilisé : numérotation, lignes, tranche payée).
 */
export async function createSubscriptionInvoice(input: {
  adminId: string;
  subscriberName: string;
  subscriberPhone: string;
  plan: PlanId;
  reference: string;
}) {
  const db = await getDb();
  const plan = PLANS[input.plan];
  if (!plan) return null;

  const clientName = `Abonnement — ${input.subscriberName}`;
  const existing = await db
    .select()
    .from(clients)
    .where(and(eq(clients.userId, input.adminId), eq(clients.name, clientName)))
    .limit(1);

  const clientId =
    existing[0]?.id ??
    (
      await db
        .insert(clients)
        .values({
          userId: input.adminId,
          name: clientName,
          phone: input.subscriberPhone,
        })
        .returning({ id: clients.id })
    )[0].id;

  const issueDate = todayISO();
  const lines = [
    { description: `Abonnement TesFacture — plan ${plan.label} (30 jours)`, quantity: 1, unitPrice: plan.price },
  ];
  const totals = computeTotals({ lines, discountPercent: 0, vatPercent: 0 });
  const number = await nextNumber(input.adminId, "FAC", Number(issueDate.slice(0, 4)));

  const doc = (
    await db
      .insert(documents)
      .values({
        userId: input.adminId,
        clientId,
        type: "FAC",
        number,
        status: "paid",
        issueDate,
        dueDate: issueDate,
        discountPercent: "0",
        vatPercent: "0",
        subtotal: String(totals.subtotal),
        discountAmount: "0",
        vatAmount: "0",
        total: String(totals.total),
        note: `Référence de paiement : ${input.reference}`,
        paymentMethods: ["Wave"],
        shareToken: newShareToken(),
      })
      .returning()
  )[0];

  await db.insert(documentItems).values(
    lines.map((line, index) => ({
      documentId: doc.id,
      position: index,
      description: line.description,
      quantity: String(line.quantity),
      unitPrice: String(line.unitPrice),
    }))
  );

  await db.insert(installments).values({
    documentId: doc.id,
    position: 0,
    label: "Paiement comptant",
    amount: String(totals.total),
    dueDate: issueDate,
    paidAt: new Date(),
    method: "Wave",
  });

  return { id: doc.id, number: doc.number, total: totals.total };
}

/** Date d'expiration « +30 jours » affichée dans l'interface d'abonnement. */
export function nextExpiry(previous: Date | null): string {
  const base = previous && previous > new Date() ? previous : new Date();
  const next = new Date(base.getTime() + 30 * 86_400_000);
  return addDaysISO(next.toISOString().slice(0, 10), 0);
}
