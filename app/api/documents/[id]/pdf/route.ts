import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getClient, getDocument, getSettings } from "@/lib/store";
import { docTotals, lineTotal, formatDateLong } from "@/lib/format";
import type { Client, Company, Document, Settings } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 48;

const dark = rgb(0.06, 0.09, 0.16);
const muted = rgb(0.42, 0.47, 0.55);
const line = rgb(0.88, 0.9, 0.94);
const brand = rgb(0.31, 0.27, 0.9);

function formatMoney(value: number, currency: string) {
  const rounded = Math.round(value);
  return `${rounded.toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ")} ${currency}`;
}

/** Découpe un texte en lignes tenant dans maxWidth. */
function wrap(text: string, font: { widthOfTextAtSize: (t: string, s: number) => number }, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const doc = getDocument(id);
  if (!doc) return new Response("Document introuvable", { status: 404 });

  const settings: Settings = getSettings();
  const company: Company = settings.company;
  const client: Client | undefined = getClient(doc.clientId);
  const totals = docTotals(doc);

  const pdf = await PDFDocument.create();
  pdf.setTitle(`${doc.type === "facture" ? "Facture" : "Devis"} ${doc.number}`);
  pdf.setAuthor(company.name);
  pdf.setCreator("tesfacture");

  const page = pdf.addPage([PAGE_W, PAGE_H]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = PAGE_H - MARGIN;

  const text = (
    value: string,
    x: number,
    yy: number,
    size = 9,
    useBold = false,
    color = dark
  ) => {
    page.drawText(value, { x, y: yy, size, font: useBold ? bold : font, color });
  };

  const textRight = (
    value: string,
    xRight: number,
    yy: number,
    size = 9,
    useBold = false,
    color = dark
  ) => {
    const f = useBold ? bold : font;
    const w = f.widthOfTextAtSize(value, size);
    text(value, xRight - w, yy, size, useBold, color);
  };

  // --- Bandeau de marque
  page.drawRectangle({ x: 0, y: PAGE_H - 118, width: PAGE_W, height: 118, color: rgb(0.98, 0.98, 1) });
  page.drawRectangle({ x: 0, y: PAGE_H - 121, width: PAGE_W, height: 3, color: brand });

  page.drawRectangle({ x: MARGIN, y: PAGE_H - 86, width: 38, height: 38, color: dark });
  text((company.logoText || "TF").slice(0, 2).toUpperCase(), MARGIN + 12, PAGE_H - 74, 12, true, rgb(1, 1, 1));

  text(`${company.name} ${company.legalForm}`.toUpperCase(), MARGIN + 50, PAGE_H - 58, 12, true);
  text(company.address, MARGIN + 50, PAGE_H - 72, 8, false, muted);
  text(`${company.city}, ${company.country}`, MARGIN + 50, PAGE_H - 83, 8, false, muted);
  text(`${company.phone} · ${company.email}`, MARGIN + 50, PAGE_H - 94, 8, false, muted);

  const title = doc.type === "facture" ? "FACTURE" : "DEVIS";
  textRight(title, PAGE_W - MARGIN, PAGE_H - 56, 22, true);
  textRight(doc.number, PAGE_W - MARGIN, PAGE_H - 72, 10, true, brand);
  textRight(`Émise le ${formatDateLong(doc.issueDate)}`, PAGE_W - MARGIN, PAGE_H - 86, 8, false, muted);
  textRight(
    `${doc.type === "facture" ? "Échéance" : "Valable jusqu'au"} ${formatDateLong(
      doc.type === "facture" ? doc.dueDate : doc.validUntil
    )}`,
    PAGE_W - MARGIN,
    PAGE_H - 97,
    8,
    false,
    muted
  );

  // --- Parties
  y = PAGE_H - 156;
  text("FACTURÉ À", MARGIN, y, 7.5, true, rgb(0.55, 0.6, 0.68));
  text("ÉMETTEUR", PAGE_W / 2 + 20, y, 7.5, true, rgb(0.55, 0.6, 0.68));

  y -= 15;
  text(client?.company || client?.name || "Client", MARGIN, y, 10, true);
  const emitterLines = [
    `NCC : ${company.taxId}`,
    `RCCM : ${company.rccm}`,
    company.bank,
    company.iban ? `Compte : ${company.iban}` : "",
  ].filter(Boolean);
  emitterLines.forEach((l, i) => text(l, PAGE_W / 2 + 20, y - i * 11, 8, false, muted));

  const clientLines = [
    client?.company ? client.name : "",
    client?.address ?? "",
    [client?.city, client?.country].filter(Boolean).join(", "),
    client?.email ?? "",
    client?.phone ?? "",
    client?.taxId ? `NCC : ${client.taxId}` : "",
  ].filter(Boolean);

  clientLines.forEach((l, i) => text(l, MARGIN, y - 14 - i * 11, 8, false, muted));

  y -= Math.max(14 + clientLines.length * 11, emitterLines.length * 11, 26) + 18;

  // --- Tableau
  const colDescX = MARGIN + 6;
  const colQtyRight = MARGIN + 320;
  const colUnitRight = MARGIN + 410;
  const colVatRight = MARGIN + 452;
  const colTotalRight = PAGE_W - MARGIN - 6;

  page.drawRectangle({ x: MARGIN, y: y - 6, width: PAGE_W - 2 * MARGIN, height: 20, color: rgb(0.96, 0.97, 0.99) });
  text("DESCRIPTION", colDescX, y, 7.5, true, muted);
  textRight("QTÉ", colQtyRight, y, 7.5, true, muted);
  textRight("P.U. HT", colUnitRight, y, 7.5, true, muted);
  textRight("TVA", colVatRight, y, 7.5, true, muted);
  textRight("TOTAL HT", colTotalRight, y, 7.5, true, muted);

  y -= 22;

  const rowHeight = 20;
  for (const l of doc.lines) {
    const wrapped = wrap(l.description, font, 8.5, 250);
    const h = Math.max(rowHeight, wrapped.length * 11 + 8);

    if (y - h < 190) {
      page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: line });
      y -= 30;
    }

    wrapped.forEach((w, i) => text(w, colDescX, y - 10 - i * 11, 8.5));
    textRight(String(l.quantity), colQtyRight, y - 10, 8.5, false, muted);
    textRight(formatMoney(l.unitPrice, "").trim(), colUnitRight, y - 10, 8.5, false, muted);
    textRight(`${l.vatRate} %`, colVatRight, y - 10, 8.5, false, muted);
    textRight(formatMoney(lineTotal(l), "").trim(), colTotalRight, y - 10, 8.5, true);

    y -= h;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: line });
  }

  // --- Totaux
  y -= 24;
  const totalsRight = PAGE_W - MARGIN;
  textRight("Total HT", totalsRight - 120, y, 9, false, muted);
  textRight(formatMoney(totals.subtotal, settings.currency), totalsRight, y, 9, true);
  y -= 15;
  textRight("TVA", totalsRight - 120, y, 9, false, muted);
  textRight(formatMoney(totals.vat, settings.currency), totalsRight, y, 9, true);

  y -= 24;
  page.drawRectangle({ x: totalsRight - 210, y: y - 6, width: 210, height: 26, color: dark });
  text("TOTAL TTC", totalsRight - 200, y + 3, 8.5, true, rgb(1, 1, 1));
  textRight(`${formatMoney(totals.total, settings.currency)}`, totalsRight - 10, y + 2, 11, true, rgb(1, 1, 1));

  if (doc.status === "payee") {
    y -= 22;
    textRight("PAYÉE", totalsRight, y, 8, true, rgb(0.02, 0.5, 0.32));
  }

  // --- Notes / conditions (colonne gauche)
  let noteY = y + 58;
  if (doc.notes) {
    text("NOTES", MARGIN, noteY, 7.5, true, rgb(0.55, 0.6, 0.68));
    wrap(doc.notes, font, 8, 260)
      .slice(0, 5)
      .forEach((w, i) => text(w, MARGIN, noteY - 13 - i * 10, 8, false, muted));
    noteY -= 13 + Math.min(5, wrap(doc.notes, font, 8, 260).length) * 10 + 8;
  }
  text("CONDITIONS DE RÈGLEMENT", MARGIN, noteY, 7.5, true, rgb(0.55, 0.6, 0.68));
  wrap(settings.paymentInstructions, font, 8, 260)
    .slice(0, 6)
    .forEach((w, i) => text(w, MARGIN, noteY - 13 - i * 10, 8, false, muted));

  // --- Pied de page
  page.drawLine({ start: { x: MARGIN, y: 78 }, end: { x: PAGE_W - MARGIN, y: 78 }, thickness: 0.5, color: line });
  const footer = wrap(settings.footerNote, font, 7.5, PAGE_W - 2 * MARGIN);
  footer.slice(0, 2).forEach((w, i) => text(w, MARGIN, 62 - i * 9, 7.5, false, muted));
  text(
    `${company.name} ${company.legalForm} · ${company.address}, ${company.city} · ${company.phone} · ${company.website}`,
    MARGIN,
    32,
    7,
    false,
    rgb(0.6, 0.65, 0.72)
  );
  textRight(`Page 1 / 1`, PAGE_W - MARGIN, 32, 7, false, rgb(0.6, 0.65, 0.72));

  const bytes = await pdf.save();
  const filename = `${doc.number}.pdf`;

  return new Response(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
