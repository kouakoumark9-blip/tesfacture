import { loadEnv } from "./env";

loadEnv();

/** Jeu de démonstration : clients, factures, devis et bon de livraison. */
async function main() {
  const { getDb } = await import("../db/client");
  const { users, clients, documents, documentItems, installments } = await import("../db/schema");
  const { nextNumber, newShareToken } = await import("../lib/documents");
  const { buildInstallments, computeTotals } = await import("../lib/calc");
  const { addDaysISO, todayISO } = await import("../lib/format");
  const { eq } = await import("drizzle-orm");

  const db = await getDb();
  const rows = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  const user = rows[0];
  if (!user) {
    console.error("Aucun compte admin. Lancez d'abord npm run db:seed.");
    process.exit(1);
  }

  const existing = await db.select().from(documents).where(eq(documents.userId, user.id));
  if (existing.length > 0) {
    console.log(`Le compte a déjà ${existing.length} document(s). Démo ignorée.`);
    process.exit(0);
  }

  const clientsSeed = [
    { name: "Krea Ecom", phone: "0707080910", email: "contact@krea.ci", address: "Cocody Angré, Abidjan" },
    { name: "Boutique Awa", phone: "0505112233", email: null, address: "Yopougon Selmer, Abidjan" },
    { name: "Cabinet Konan", phone: "0102445566", email: "info@konan.ci", address: "Plateau, Abidjan" },
    { name: "Hôtel Baobab", phone: "0707998877", email: null, address: "Grand-Bassam" },
  ];

  const createdClients = [];
  for (const client of clientsSeed) {
    const inserted = await db
      .insert(clients)
      .values({ userId: user.id, ...client })
      .returning();
    createdClients.push(inserted[0]);
  }

  const today = todayISO();

  type Spec = {
    type: "FAC" | "DEV" | "BL";
    clientIndex: number;
    daysAgo: number;
    items: { description: string; quantity: number; unitPrice: number }[];
    discountPercent?: number;
    vatPercent?: 0 | 18;
    status?: string;
    installmentCount?: number;
    depositRatio?: number;
    paidCount?: number;
    note?: string;
    paymentMethods?: string[];
  };

  const specs: Spec[] = [
    {
      type: "FAC",
      clientIndex: 0,
      daysAgo: 21,
      items: [
        { description: "Création de site web vitrine", quantity: 1, unitPrice: 450_000 },
        { description: "Nom de domaine et hébergement (1 an)", quantity: 1, unitPrice: 45_000 },
      ],
      vatPercent: 18,
      installmentCount: 4,
      depositRatio: 0.3,
      paidCount: 2,
      paymentMethods: ["Wave", "Espèces"],
      note: "Livraison sous 30 jours après validation de la maquette.",
      status: "partial",
    },
    {
      type: "FAC",
      clientIndex: 1,
      daysAgo: 60,
      items: [{ description: "Vente de marchandises — lot de 20 sacs", quantity: 20, unitPrice: 12_500 }],
      vatPercent: 0,
      discountPercent: 5,
      installmentCount: 1,
      status: "paid",
      paymentMethods: ["Orange Money", "Espèces"],
    },
    {
      type: "FAC",
      clientIndex: 2,
      daysAgo: 45,
      items: [
        { description: "Prestation de conseil juridique", quantity: 1, unitPrice: 300_000 },
        { description: "Rédaction de contrats", quantity: 3, unitPrice: 75_000 },
      ],
      vatPercent: 18,
      installmentCount: 3,
      depositRatio: 0.4,
      paidCount: 0,
      status: "overdue",
      paymentMethods: ["Virement", "Wave"],
    },
    {
      type: "DEV",
      clientIndex: 3,
      daysAgo: 8,
      items: [
        { description: "Refonte du site de réservation", quantity: 1, unitPrice: 850_000 },
        { description: "Intégration du paiement Mobile Money", quantity: 1, unitPrice: 250_000 },
      ],
      vatPercent: 18,
      installmentCount: 1,
      status: "sent",
      paymentMethods: ["Wave"],
    },
    {
      type: "DEV",
      clientIndex: 1,
      daysAgo: 3,
      items: [{ description: "Création de logo et charte graphique", quantity: 1, unitPrice: 175_000 }],
      vatPercent: 0,
      installmentCount: 1,
      status: "draft",
    },
    {
      type: "BL",
      clientIndex: 0,
      daysAgo: 2,
      items: [
        { description: "Livraison imprimante HP LaserJet", quantity: 1, unitPrice: 0 },
        { description: "Ramette de papier A4 (500 feuilles)", quantity: 5, unitPrice: 0 },
      ],
      status: "delivered",
    },
  ];

  for (const spec of specs) {
    const issueDate = addDaysISO(today, -spec.daysAgo);
    const dueDate = addDaysISO(issueDate, 30);
    const client = createdClients[spec.clientIndex];
    const totals = computeTotals({
      lines: spec.items,
      discountPercent: spec.discountPercent ?? 0,
      vatPercent: spec.vatPercent ?? 0,
    });
    const number = await nextNumber(user.id, spec.type, Number(issueDate.slice(0, 4)));

    const doc = (
      await db
        .insert(documents)
        .values({
          userId: user.id,
          clientId: client.id,
          type: spec.type,
          number,
          status: spec.status ?? "draft",
          issueDate,
          dueDate: spec.type === "BL" ? null : dueDate,
          discountPercent: String(spec.discountPercent ?? 0),
          vatPercent: String(spec.vatPercent ?? 0),
          subtotal: String(totals.subtotal),
          discountAmount: String(totals.discountAmount),
          vatAmount: String(totals.vatAmount),
          total: String(totals.total),
          note: spec.note ?? null,
          paymentMethods: spec.paymentMethods ?? [],
          deliveryAddress: spec.type === "BL" ? client.address : null,
          deliveredBy: spec.type === "BL" ? "Kouassi (livreur)" : null,
          shareToken: newShareToken(),
        })
        .returning()
    )[0];

    await db.insert(documentItems).values(
      spec.items.map((item, index) => ({
        documentId: doc.id,
        position: index,
        description: item.description,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
      }))
    );

    if (spec.type !== "BL") {
      const targetStatus = spec.status ?? "draft";
      const count = spec.installmentCount ?? 1;
      const deposit = Math.round(totals.total * (spec.depositRatio ?? 0));
      const plan = buildInstallments(totals.total, count, deposit);

      // Le premier versement tombe à l'émission, les suivants tous les 15 jours.
      await db.insert(installments).values(
        plan.map((item, index) => {
          const paid = index < (spec.paidCount ?? (targetStatus === "paid" ? count : 0));
          const due = addDaysISO(issueDate, index * 15);
          // Facture en retard : échéances passées, non payées
          const dueFinal = targetStatus === "overdue" ? addDaysISO(today, -12 + index * 4) : due;
          return {
            documentId: doc.id,
            position: index,
            label: item.label,
            amount: String(item.amount),
            dueDate: dueFinal,
            paidAt: paid ? new Date(`${addDaysISO(issueDate, 1)}T10:00:00Z`) : null,
            method: paid ? spec.paymentMethods?.[0] ?? "Espèces" : null,
          };
        })
      );
    }
  }

  console.log("✓ Démonstration créée : 4 clients, 3 factures, 2 devis, 1 bon de livraison.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Démo échouée :", error);
  process.exit(1);
});
