import React from "react";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  Image,
} from "@react-pdf/renderer";
import type { PreviewDoc } from "@/lib/preview";
import { DOC_TYPE_LABEL } from "@/lib/preview";
import { amount, dateShort } from "@/lib/format";
import { amountInWords } from "@/lib/money";

// Pas de césure automatique : les mots français ne doivent pas être coupés.
Font.registerHyphenationCallback((word) => [word]);

const GREEN = "#0E6B43";
const GREEN_LIGHT = "#E8F3ED";
const INK = "#12241B";
const MUTED = "#6B7C74";
const LINE = "#DDE5E0";

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 46,
    paddingHorizontal: 34,
    fontSize: 8.5,
    color: INK,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: GREEN,
    paddingBottom: 10,
  },
  brandRow: { flexDirection: "row", gap: 8, width: "62%" },
  logo: { width: 44, height: 44, objectFit: "contain", borderRadius: 4 },
  logoFallback: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: GREEN,
    color: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#FFFFFF", fontSize: 13, fontFamily: "Helvetica-Bold" },
  companyName: { fontSize: 12, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  meta: { color: MUTED, fontSize: 7.6, marginTop: 2, lineHeight: 1.35 },
  docBlock: { alignItems: "flex-end" },
  docTitle: { fontSize: 17, fontFamily: "Helvetica-Bold", color: GREEN },
  docNumber: { fontSize: 9, fontFamily: "Helvetica-Bold", marginTop: 2 },
  parties: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, gap: 20 },
  partyLabel: {
    fontSize: 6.8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  partyName: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  table: { marginTop: 12 },
  th: {
    flexDirection: "row",
    backgroundColor: GREEN_LIGHT,
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: LINE,
  },
  thText: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: "#41544B",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderBottomWidth: 0.5,
    borderColor: LINE,
  },
  colDesc: { flex: 1 },
  colQty: { width: 38, textAlign: "right" },
  colPrice: { width: 72, textAlign: "right" },
  colTotal: { width: 74, textAlign: "right" },
  cell: { fontSize: 8.5 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  words: { width: "52%", fontSize: 7.8, lineHeight: 1.4, color: "#3C4F46" },
  totalsBox: { width: "42%" },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  totalLabel: { color: MUTED },
  grand: {
    marginTop: 3,
    backgroundColor: GREEN,
    color: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 7,
    borderRadius: 3,
  },
  grandText: { color: "#FFFFFF", fontFamily: "Helvetica-Bold" },
  sectionLabel: {
    fontSize: 6.8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 4,
  },
  installmentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderColor: LINE,
  },
  paymentChip: {
    borderWidth: 0.5,
    borderColor: LINE,
    borderRadius: 3,
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginRight: 4,
    marginBottom: 4,
    fontSize: 7.4,
  },
  signatures: { flexDirection: "row", justifyContent: "space-between", marginTop: 22, gap: 24 },
  signatureBox: { width: "46%" },
  signatureLine: {
    marginTop: 4,
    height: 38,
    borderWidth: 0.6,
    borderColor: "#B9C7C0",
    borderStyle: "dashed",
    borderRadius: 3,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 34,
    right: 34,
    borderTopWidth: 0.5,
    borderColor: LINE,
    paddingTop: 5,
    alignItems: "center",
  },
  footerText: { fontSize: 6.6, color: "#98A8A0", textAlign: "center" },
  watermark: {
    marginTop: 8,
    fontSize: 6.6,
    color: "#98A8A0",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});

export default function DocumentPdf({
  doc,
  watermark,
}: {
  doc: PreviewDoc;
  watermark: boolean;
}) {
  const isBL = doc.type === "BL";
  const paymentNumbers: Record<string, string | undefined> = doc.company.paymentNumbers ?? {};

  return (
    <Document
      title={`${DOC_TYPE_LABEL[doc.type]} ${doc.number}`}
      author={doc.company.name}
      creator="FactureCI"
      producer="FactureCI"
    >
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            {doc.company.logo ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={doc.company.logo} style={styles.logo} />
            ) : (
              <View style={styles.logoFallback}>
                <Text style={styles.logoText}>{doc.company.name.slice(0, 2).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.companyName}>{doc.company.name}</Text>
              <Text style={styles.meta}>
                {doc.company.address ?? ""}
                {doc.company.phone ? `\n${doc.company.phone}` : ""}
                {doc.company.rccm ? `\nRCCM : ${doc.company.rccm}` : ""}
                {doc.company.taxNumber ? `\nCompte contribuable : ${doc.company.taxNumber}` : ""}
              </Text>
            </View>
          </View>

          <View style={styles.docBlock}>
            <Text style={styles.docTitle}>{DOC_TYPE_LABEL[doc.type].toUpperCase()}</Text>
            <Text style={styles.docNumber}>{doc.number}</Text>
            <Text style={styles.meta}>Date : {dateShort(doc.issueDate)}</Text>
            {!isBL && doc.dueDate && (
              <Text style={styles.meta}>Échéance : {dateShort(doc.dueDate)}</Text>
            )}
          </View>
        </View>

        {/* Client */}
        <View style={styles.parties}>
          <View style={{ maxWidth: "58%" }}>
            <Text style={styles.partyLabel}>{isBL ? "Livré à" : "Facturé à"}</Text>
            <Text style={styles.partyName}>{doc.client.name}</Text>
            <Text style={styles.meta}>
              {(isBL ? doc.deliveryAddress : doc.client.address) ?? ""}
              {doc.client.phone ? `\n${doc.client.phone}` : ""}
              {doc.client.email ? `\n${doc.client.email}` : ""}
            </Text>
          </View>
          {isBL && doc.deliveredBy ? (
            <View>
              <Text style={styles.partyLabel}>Livreur</Text>
              <Text style={styles.partyName}>{doc.deliveredBy}</Text>
            </View>
          ) : null}
        </View>

        {/* Tableau */}
        <View style={styles.table}>
          <View style={styles.th} fixed>
            <Text style={[styles.thText, styles.colDesc]}>Désignation</Text>
            <Text style={[styles.thText, styles.colQty]}>Qté</Text>
            {!isBL && <Text style={[styles.thText, styles.colPrice]}>Prix unitaire</Text>}
            {!isBL && <Text style={[styles.thText, styles.colTotal]}>Montant</Text>}
          </View>

          {doc.items.map((item, index) => (
            <View key={`${item.description}-${index}`} style={styles.tr} wrap={false}>
              <Text style={[styles.cell, styles.colDesc]}>{item.description}</Text>
              <Text style={[styles.cell, styles.colQty]}>
                {new Intl.NumberFormat("fr-FR").format(item.quantity)}
              </Text>
              {!isBL && <Text style={[styles.cell, styles.colPrice]}>{amount(item.unitPrice)}</Text>}
              {!isBL && (
                <Text style={[styles.cell, styles.colTotal, { fontFamily: "Helvetica-Bold" }]}>
                  {amount(item.total)}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Totaux */}
        {!isBL && (
          <View style={styles.totalsRow} wrap={false}>
            <View style={styles.words}>
              <Text>{amountInWords(doc.total)}</Text>
              {doc.note ? (
                <>
                  <Text style={styles.sectionLabel}>Note</Text>
                  <Text style={{ fontSize: 7.8, color: "#3C4F46" }}>{doc.note}</Text>
                </>
              ) : null}
            </View>

            <View style={styles.totalsBox}>
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>Sous-total</Text>
                <Text>{amount(doc.subtotal)}</Text>
              </View>
              {doc.discountPercent > 0 && (
                <View style={styles.totalLine}>
                  <Text style={styles.totalLabel}>Remise ({doc.discountPercent} %)</Text>
                  <Text>− {amount(doc.discountAmount)}</Text>
                </View>
              )}
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>
                  {doc.vatPercent > 0 ? `TVA (${doc.vatPercent} %)` : "TVA (non applicable)"}
                </Text>
                <Text>{amount(doc.vatAmount)}</Text>
              </View>
              <View style={styles.grand}>
                <Text style={styles.grandText}>TOTAL</Text>
                <Text style={styles.grandText}>{amount(doc.total)} FCFA</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tranches */}
        {!isBL && doc.installments.length > 1 && (
          <View wrap={false}>
            <Text style={styles.sectionLabel}>Échéancier de paiement</Text>
            {doc.installments.map((item) => (
              <View key={item.id} style={styles.installmentRow}>
                <Text style={{ width: "32%", fontFamily: "Helvetica-Bold" }}>{item.label}</Text>
                <Text style={{ width: "26%", color: MUTED }}>
                  {item.dueDate ? dateShort(item.dueDate) : ""}
                </Text>
                <Text style={{ width: "22%", textAlign: "right" }}>{amount(item.amount)}</Text>
                <Text
                  style={{
                    width: "20%",
                    textAlign: "right",
                    color: item.paidAt ? GREEN : "#98A8A0",
                    fontFamily: "Helvetica-Bold",
                  }}
                >
                  {item.paidAt ? "Payé" : "À payer"}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Moyens de paiement */}
        {!isBL && doc.paymentMethods.length > 0 && (
          <View wrap={false}>
            <Text style={styles.sectionLabel}>Moyens de paiement</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {doc.paymentMethods.map((method) => {
                const key =
                  method === "Wave"
                    ? "wave"
                    : method === "Orange Money"
                      ? "orange"
                      : method === "MTN Money"
                        ? "mtn"
                        : method === "Moov Money"
                          ? "moov"
                          : null;
                const number = key ? paymentNumbers[key] : undefined;
                return (
                  <Text key={method} style={styles.paymentChip}>
                    {method}
                    {number ? ` · ${number}` : ""}
                  </Text>
                );
              })}
            </View>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatures} wrap={false}>
          <View style={styles.signatureBox}>
            <Text style={styles.partyLabel}>{isBL ? "Le livreur" : "Le prestataire"}</Text>
            {!isBL && <Text style={{ fontSize: 7.8, color: MUTED }}>{doc.company.name}</Text>}
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.partyLabel}>
              {isBL ? "Reçu par (nom, date, signature)" : "Cachet et signature du client"}
            </Text>
            <View style={styles.signatureLine} />
          </View>
        </View>

        {watermark && <Text style={styles.watermark}>Créé avec FactureCI</Text>}

        {/* Pied de page */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {doc.company.name}
            {doc.company.address ? ` · ${doc.company.address}` : ""}
            {doc.company.phone ? ` · ${doc.company.phone}` : ""} · Généré avec FactureCI
          </Text>
        </View>
      </Page>
    </Document>
  );
}
