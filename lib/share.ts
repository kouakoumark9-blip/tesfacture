import type { PreviewDoc } from "./preview";
import { amount, dateShort } from "./format";
import { DOC_TYPE_LABEL } from "./preview";

/** Numéro pour les liens wa.me : 10 chiffres => préfixe 225. */
export function whatsappNumber(phone: string | null | undefined): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("225")) return digits;
  if (digits.startsWith("00225")) return digits.slice(2);
  if (digits.length === 10) return `225${digits}`;
  return digits;
}

export function publicLink(token: string, appUrl?: string): string {
  const base =
    appUrl || (typeof window !== "undefined" ? window.location.origin : process.env.APP_URL) || "";
  return `${base.replace(/\/$/, "")}/d/${token}`;
}

function paymentLines(doc: PreviewDoc): string[] {
  if (doc.paymentMethods.length === 0) return [];
  return doc.paymentMethods.map((method) => {
    const key = methodKey(method);
    const number = key ? doc.company.paymentNumbers[key] : undefined;
    return number ? `${method} : ${number}` : method;
  });
}

function methodKey(method: string): string | null {
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

/** Message WhatsApp / e-mail d'envoi du document. */
export function documentMessage(doc: PreviewDoc, link?: string): string {
  const label = DOC_TYPE_LABEL[doc.type].toLowerCase();
  const lines: string[] = [];

  lines.push(`Bonjour ${doc.client.name},`);
  lines.push("");
  lines.push(
    `Voici votre ${label} ${doc.number} du ${dateShort(doc.issueDate)}${
      doc.type === "BL" ? "" : ` d'un montant de ${amount(doc.total)} FCFA`
    }.`
  );

  if (doc.type !== "BL" && doc.installments.length > 1) {
    lines.push("");
    lines.push("Échéancier :");
    for (const item of doc.installments) {
      lines.push(
        `• ${item.label} : ${amount(item.amount)} FCFA${item.dueDate ? ` — ${dateShort(item.dueDate)}` : ""}${item.paidAt ? " (payé)" : ""}`
      );
    }
  }

  const payments = paymentLines(doc);
  if (payments.length > 0) {
    lines.push("");
    lines.push("Moyens de paiement :");
    for (const line of payments) lines.push(`• ${line}`);
  }

  if (link) {
    lines.push("");
    lines.push(`Voir le document : ${link}`);
  }

  lines.push("");
  lines.push(`Merci pour votre confiance.`);
  lines.push(doc.company.name);

  return lines.join("\n");
}

export function whatsappUrl(phone: string | null | undefined, message: string): string {
  const number = whatsappNumber(phone);
  const text = encodeURIComponent(message);
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function mailtoUrl(email: string | null | undefined, subject: string, message: string): string {
  const params = new URLSearchParams({ subject, body: message });
  return `mailto:${email ?? ""}?${params.toString().replace(/\+/g, "%20")}`;
}

export function smsUrl(phone: string | null | undefined, message: string): string {
  return `sms:${(phone || "").replace(/\s/g, "")}?body=${encodeURIComponent(message)}`;
}

/** Message de relance poli pour une tranche impayée. */
export function reminderMessage(input: {
  clientName: string;
  companyName: string;
  documentNumber: string;
  installmentLabel: string;
  amount: number;
  dueDate: string | null;
  paymentMethods: string[];
  paymentNumbers: Record<string, string | undefined>;
  appUrl?: string;
  shareToken?: string;
}): string {
  const lines = [
    `Bonjour ${input.clientName},`,
    "",
    `Petit rappel amical concernant la ${input.installmentLabel.toLowerCase()} de la facture ${input.documentNumber}${
      input.dueDate ? `, arrivée à échéance le ${dateShort(input.dueDate)}` : ""
    } : ${amount(input.amount)} FCFA.`,
  ];

  if (input.paymentMethods.length > 0) {
    lines.push("");
    lines.push("Vous pouvez régler par :");
    for (const method of input.paymentMethods) {
      const key = methodKey(method);
      const number = key ? input.paymentNumbers[key] : undefined;
      lines.push(`• ${method}${number ? ` : ${number}` : ""}`);
    }
  }

  if (input.shareToken) {
    lines.push("");
    lines.push(`Facture : ${publicLink(input.shareToken, input.appUrl)}`);
  }

  lines.push("");
  lines.push("Merci d'avance et bonne journée.");
  lines.push(input.companyName);

  return lines.join("\n");
}

/** Message de confirmation après réception d'un paiement. */
export function paymentConfirmationMessage(input: {
  clientName: string;
  companyName: string;
  documentNumber: string;
  amount: number;
  method: string;
}): string {
  return [
    `Bonjour ${input.clientName},`,
    "",
    `Nous confirmons la réception de votre paiement de ${amount(input.amount)} FCFA (${input.method}) pour la facture ${input.documentNumber}.`,
    "",
    "Merci pour votre confiance.",
    input.companyName,
  ].join("\n");
}
