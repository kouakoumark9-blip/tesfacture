import { describe, expect, it } from "vitest";
import { amountInWords, numberToFrenchWords } from "./money";

describe("montant en lettres", () => {
  const cases: [number, string][] = [
    [0, "zéro"],
    [1, "un"],
    [17, "dix-sept"],
    [21, "vingt et un"],
    [71, "soixante et onze"],
    [80, "quatre-vingts"],
    [81, "quatre-vingt-un"],
    [90, "quatre-vingt-dix"],
    [91, "quatre-vingt-onze"],
    [99, "quatre-vingt-dix-neuf"],
    [100, "cent"],
    [101, "cent un"],
    [200, "deux cents"],
    [201, "deux cent un"],
    [999, "neuf cent quatre-vingt-dix-neuf"],
    [1_000, "mille"],
    [1_001, "mille un"],
    [2_000, "deux mille"],
    [60_000, "soixante mille"],
    [63_720, "soixante-trois mille sept cent vingt"],
    [1_250_000, "un million deux cent cinquante mille"],
    [1_000_000, "un million"],
    [2_500_000, "deux millions cinq cent mille"],
  ];

  it.each(cases)("%i -> « %s »", (value, expected) => {
    expect(numberToFrenchWords(value)).toBe(expected);
  });

  it("produit la phrase du document", () => {
    expect(amountInWords(60_000)).toBe(
      "Arrêté à la somme de : soixante mille francs CFA."
    );
  });

  it("arrondit les centimes", () => {
    expect(numberToFrenchWords(1_250_000.4)).toBe("un million deux cent cinquante mille");
  });
});
