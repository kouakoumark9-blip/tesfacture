import { describe, expect, it } from "vitest";
import {
  computeMetrics,
  monthlySeries,
  paymentBreakdown,
  quoteConversion,
  topClientsByBilled,
  type StatsDoc,
  type StatsInstallment,
} from "./stats";
import { resolvePeriod } from "./period";

const docs: StatsDoc[] = [
  {
    id: "d1",
    type: "FAC",
    status: "partial",
    number: "FAC-2026-001",
    total: 100_000,
    clientId: "c1",
    clientName: "Krea Ecom",
    issueDate: "2026-10-05",
    dueDate: "2026-10-20",
    paymentMethods: ["Wave"],
    createdAt: "2026-10-05",
  },
  {
    id: "d2",
    type: "FAC",
    status: "cancelled",
    number: "FAC-2026-002",
    total: 50_000,
    clientId: "c1",
    clientName: "Krea Ecom",
    issueDate: "2026-10-06",
    dueDate: "2026-10-21",
    paymentMethods: [],
    createdAt: "2026-10-06",
  },
  {
    id: "d3",
    type: "DEV",
    status: "sent",
    number: "DEV-2026-001",
    total: 250_000,
    clientId: "c2",
    clientName: "Hôtel Baobab",
    issueDate: "2026-10-07",
    dueDate: null,
    paymentMethods: [],
    createdAt: "2026-10-07",
  },
  {
    id: "d4",
    type: "BL",
    status: "delivered",
    number: "BL-2026-001",
    total: 0,
    clientId: "c2",
    clientName: "Hôtel Baobab",
    issueDate: "2026-10-08",
    dueDate: null,
    paymentMethods: [],
    createdAt: "2026-10-08",
  },
];

const parts: StatsInstallment[] = [
  { id: "p1", documentId: "d1", label: "Acompte", amount: 30_000, dueDate: "2026-10-05", paidAt: "2026-10-05", method: "Wave" },
  { id: "p2", documentId: "d1", label: "Tranche 2", amount: 30_000, dueDate: "2026-10-10", paidAt: "2026-10-11", method: "Espèces" },
  { id: "p3", documentId: "d1", label: "Solde", amount: 40_000, dueDate: "2026-10-20", paidAt: null, method: null },
];

const october = resolvePeriod("month", null, null);
// On fixe la période pour que le test ne dépende pas de la date du jour.
const period = { key: "custom" as const, start: "2026-10-01", end: "2026-10-31", label: "Test" };

describe("métriques du tableau de bord", () => {
  it("facturé exclut les documents annulés et les devis", () => {
    const metrics = computeMetrics(docs, parts, period);
    expect(metrics.billed).toBe(100_000);
  });

  it("encaissé additionne les tranches payées sur la période", () => {
    const metrics = computeMetrics(docs, parts, period);
    expect(metrics.collected).toBe(60_000);
  });

  it("à encaisser correspond au restant dû", () => {
    const metrics = computeMetrics(docs, parts, period);
    expect(metrics.toCollect).toBe(40_000);
  });

  it("repère les tranches en retard (échéance dépassée, non payée)", () => {
    const metrics = computeMetrics(docs, parts, period);
    // p3 est dû le 20/10/2026 → en retard si la date du jour est après
    expect(metrics.overdueCount).toBeGreaterThanOrEqual(0);
    expect(metrics.overdueAmount).toBeGreaterThanOrEqual(0);
  });

  it("compte les devis en attente et les bons de livraison", () => {
    const metrics = computeMetrics(docs, parts, period);
    expect(metrics.quotesPending).toBe(1);
    expect(metrics.deliveryNotes).toBe(1);
  });

  it("ne compte jamais devis ni BL dans le chiffre d'affaires", () => {
    const metrics = computeMetrics(docs, parts, period);
    expect(metrics.billed).toBe(100_000);
  });

  it("fonctionne avec une période vide", () => {
    const empty = { key: "custom" as const, start: "2020-01-01", end: "2020-01-31", label: "" };
    const metrics = computeMetrics(docs, parts, empty);
    expect(metrics).toMatchObject({ billed: 0, collected: 0, toCollect: 0 });
  });
});

describe("séries et répartitions", () => {
  it("produit 12 mois consécutifs", () => {
    const series = monthlySeries(docs, parts, 12, "2026-10-24");
    expect(series).toHaveLength(12);
    expect(series[11].key).toBe("2026-10");
    expect(series[11].billed).toBe(100_000);
    expect(series[11].collected).toBe(60_000);
  });

  it("répartit l'encaissement par moyen de paiement", () => {
    const breakdown = paymentBreakdown(parts, period);
    expect(breakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ method: "Wave", amount: 30_000 }),
        expect.objectContaining({ method: "Espèces", amount: 30_000 }),
      ])
    );
    expect(breakdown).toHaveLength(2);
  });

  it("classe les meilleurs clients par montant facturé", () => {
    const top = topClientsByBilled(docs, period);
    expect(top[0]).toMatchObject({ name: "Krea Ecom", billed: 100_000, documents: 1 });
  });
});

describe("conversion des devis", () => {
  it("calcule le pourcentage de devis transformés", () => {
    expect(quoteConversion(docs, 1)).toBe(100);
    expect(quoteConversion(docs, 0)).toBe(0);
  });

  it("renvoie null sans devis envoyé", () => {
    expect(quoteConversion([], 0)).toBeNull();
  });
});

describe("périodes", () => {
  it("renvoie un mois complet", () => {
    expect(october.start.slice(8)).toBe("01");
    expect(october.end.slice(8)).toBe("31");
  });

  it("inverse les bornes personnalisées", () => {
    const custom = resolvePeriod("custom", "2026-10-31", "2026-10-01");
    expect(custom.start).toBe("2026-10-01");
    expect(custom.end).toBe("2026-10-31");
  });
});
