/**
 * Conversion d'un montant en lettres, en français.
 * « Arrêté à la somme de : soixante mille francs CFA. »
 */

const UNITS = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
];

const TENS: Record<number, string> = {
  20: "vingt",
  30: "trente",
  40: "quarante",
  50: "cinquante",
  60: "soixante",
  80: "quatre-vingts",
  90: "quatre-vingt-dix",
};

function below100(n: number, isFinal = true): string {
  if (n < 17) return UNITS[n];
  if (n < 20) return `dix-${UNITS[n - 10]}`;

  // 70-79 : soixante et onze, soixante-douze…
  if (n < 70) {
    const ten = Math.floor(n / 10) * 10;
    const unit = n % 10;
    if (unit === 0) return TENS[ten];
    if (unit === 1) return `${TENS[ten]} et un`;
    return `${TENS[ten]}-${UNITS[unit]}`;
  }

  if (n < 80) {
    const rest = n - 60;
    const base = TENS[60];
    if (rest === 11) return `${base} et onze`;
    if (rest === 1) return `${base} et un`;
    return `${base}-${below100(rest)}`;
  }

  if (n === 80) return isFinal ? "quatre-vingts" : "quatre-vingt";
  if (n < 100) {
    // 81-99 : quatre-vingt-un, quatre-vingt-dix, quatre-vingt-onze…
    return `quatre-vingt-${below100(n - 80)}`;
  }

  return "";
}

function below1000(n: number, isFinal = true): string {
  if (n < 100) return below100(n, isFinal);

  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const plural = rest === 0 && isFinal ? "s" : "";
  const hundredWord = hundreds === 1 ? "cent" : `${UNITS[hundreds]} cent${plural}`;

  if (rest === 0) return hundredWord;
  return `${hundredWord} ${below100(rest, isFinal)}`;
}

function integerToWords(n: number, isFinal = true): string {
  if (n === 0) return "zéro";
  if (n < 0) return `moins ${integerToWords(Math.abs(n), isFinal)}`;
  if (n < 1_000) return below1000(n, isFinal);

  if (n < 1_000_000) {
    const thousands = Math.floor(n / 1_000);
    const rest = n % 1_000;
    // « cents » et « quatre-vingts » perdent leur s devant « mille »
    const thousandsWord = thousands === 1 ? "mille" : `${below1000(thousands, false)} mille`;
    return rest === 0 ? thousandsWord : `${thousandsWord} ${below1000(rest, isFinal)}`;
  }

  if (n < 1_000_000_000) {
    const millions = Math.floor(n / 1_000_000);
    const rest = n % 1_000_000;
    const millionsWord =
      millions === 1
        ? "un million"
        : `${integerToWords(millions, rest === 0 && isFinal)} millions`;
    return rest === 0 ? millionsWord : `${millionsWord} ${integerToWords(rest, isFinal)}`;
  }

  if (n < 1_000_000_000_000) {
    const billions = Math.floor(n / 1_000_000_000);
    const rest = n % 1_000_000_000;
    const billionsWord =
      billions === 1
        ? "un milliard"
        : `${integerToWords(billions, rest === 0 && isFinal)} milliards`;
    return rest === 0 ? billionsWord : `${billionsWord} ${integerToWords(rest, isFinal)}`;
  }

  return integerToWords(Math.floor(n), isFinal);
}

/** 60000 -> "soixante mille" */
export function numberToFrenchWords(n: number): string {
  return integerToWords(Math.round(Math.abs(n)));
}

/** Phrase complète utilisée sur les documents. */
export function amountInWords(n: number, currency = "francs CFA"): string {
  const rounded = Math.round(n);
  const words = integerToWords(Math.abs(rounded));
  const sign = rounded < 0 ? "moins " : "";
  return `Arrêté à la somme de : ${sign}${words} ${currency}.`;
}
