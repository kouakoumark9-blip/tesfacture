import { describe, expect, it } from "vitest";
import {
  buildInstallments,
  computeStatus,
  computeTotals,
  installmentsSum,
  installmentsValid,
  lineTotal,
  remainingAmount,
} from "./calc";

describe("lignes et totaux", () => {
  it("calcule le total d'une ligne", () => {
    expect(lineTotal({ quantity: 3, unitPrice: 15_000 })).toBe(45_000);
    expect(lineTotal({ quantity: 0, unitPrice: 15_000 })).toBe(0);
  });

  it("calcule sous-total, remise, TVA et total (60 000, remise 10 %, TVA 18 %)", () => {
    const totals = computeTotals({
      lines: [
        { quantity: 1, unitPrice: 45_000 },
        { quantity: 1, unitPrice: 15_000 },
      ],
      discountPercent: 10,
      vatPercent: 18,
    });

    expect(totals.subtotal).toBe(60_000);
    expect(totals.discountAmount).toBe(6_000);
    expect(totals.vatAmount).toBe(9_720); // 54 000 × 18 %
    expect(totals.total).toBe(63_720);
  });

  it("sans remise ni TVA, le total égale le sous-total", () => {
    const totals = computeTotals({ lines: [{ quantity: 2, unitPrice: 30_000 }] });
    expect(totals).toEqual({
      subtotal: 60_000,
      discountAmount: 0,
      vatAmount: 0,
      total: 60_000,
    });
  });

  it("arrondit les montants à l'unité", () => {
    const totals = computeTotals({
      lines: [{ quantity: 3, unitPrice: 3_333.33 }],
      discountPercent: 5,
      vatPercent: 18,
    });
    expect(Number.isInteger(totals.subtotal)).toBe(true);
    expect(Number.isInteger(totals.discountAmount)).toBe(true);
    expect(Number.isInteger(totals.vatAmount)).toBe(true);
    expect(Number.isInteger(totals.total)).toBe(true);
  });
});

describe("paiement en tranches", () => {
  it("une seule tranche : paiement comptant, pas d'acompte", () => {
    const plan = buildInstallments(60_000, 1, 20_000);
    expect(plan).toEqual([{ position: 0, label: "Paiement comptant", amount: 60_000 }]);
  });

  it("60 000 avec acompte de 20 000 en 4 tranches", () => {
    const plan = buildInstallments(60_000, 4, 20_000);
    expect(plan.map((p) => p.amount)).toEqual([20_000, 13_300, 13_300, 13_400]);
    expect(plan.map((p) => p.label)).toEqual(["Acompte", "Tranche 2", "Tranche 3", "Solde"]);
    expect(installmentsSum(plan)).toBe(60_000);
    expect(installmentsValid(plan, 60_000)).toBe(true);
  });

  it("la dernière tranche absorbe la différence, quelle que soit la division", () => {
    for (const total of [10_000, 63_720, 125_000, 999_999]) {
      for (const count of [2, 3, 5, 6]) {
        const plan = buildInstallments(total, count, Math.round(total * 0.3));
        expect(installmentsSum(plan)).toBe(total);
        expect(plan).toHaveLength(count);
      }
    }
  });

  it("sans acompte, les tranches se partagent tout le montant", () => {
    const plan = buildInstallments(50_000, 3, 0);
    expect(installmentsSum(plan)).toBe(50_000);
    expect(plan[0].amount).toBe(0);
  });

  it("calcule le restant dû", () => {
    expect(
      remainingAmount([
        { amount: 20_000, paidAt: new Date() },
        { amount: 13_300 },
        { amount: 26_700, paidAt: null },
      ])
    ).toBe(40_000);
  });
});

describe("statut automatique", () => {
  const today = "2026-10-24";

  it("payé quand toutes les tranches sont réglées", () => {
    expect(
      computeStatus("sent", [
        { amount: 30_000, paidAt: "2026-10-01", dueDate: "2026-10-01" },
        { amount: 30_000, paidAt: "2026-10-10", dueDate: "2026-10-10" },
      ], today)
    ).toBe("paid");
  });

  it("partiel quand une seule tranche est réglée", () => {
    expect(
      computeStatus("sent", [
        { amount: 20_000, paidAt: "2026-10-01", dueDate: "2026-10-01" },
        { amount: 40_000, dueDate: "2026-11-30" },
      ], today)
    ).toBe("partial");
  });

  it("en retard quand une échéance est dépassée sans paiement", () => {
    expect(
      computeStatus("sent", [
        { amount: 20_000, paidAt: "2026-10-01", dueDate: "2026-10-01" },
        { amount: 40_000, dueDate: "2026-10-20" },
      ], today)
    ).toBe("overdue");
  });

  it("reste envoyé sans paiement ni retard", () => {
    expect(
      computeStatus("sent", [{ amount: 40_000, dueDate: "2026-12-01" }], today)
    ).toBe("sent");
  });

  it("ne touche pas aux brouillons ni aux annulés", () => {
    expect(computeStatus("draft", [{ amount: 10_000, dueDate: "2026-01-01" }], today)).toBe(
      "draft"
    );
    expect(
      computeStatus("cancelled", [{ amount: 10_000, paidAt: "2026-10-01" }], today)
    ).toBe("cancelled");
  });
});
