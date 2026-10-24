import { requireUser } from "@/lib/session";
import { listDocuments } from "@/lib/documents";
import DocumentsList from "@/components/documents-list";

export const metadata = { title: "Factures — FactureCI" };
export const dynamic = "force-dynamic";

export default async function FacturesPage() {
  const user = await requireUser();
  const rows = await listDocuments(user.id, { type: "FAC" });
  const total = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <DocumentsList
      type="FAC"
      title="Factures"
      subtitle={`${rows.length} facture${rows.length > 1 ? "s" : ""} · ${new Intl.NumberFormat("fr-FR").format(total)} FCFA facturés`}
      createHref="/app/documents/nouveau?type=FAC"
      createLabel="Nouvelle facture"
      documents={rows.map((row) => ({
        id: row.doc.id,
        type: row.doc.type as "FAC" | "DEV" | "BL",
        number: row.doc.number,
        status: row.doc.status,
        issueDate: row.doc.issueDate,
        dueDate: row.doc.dueDate,
        total: row.total,
        clientName: row.clientName,
        paidCount: row.paidCount,
        installmentCount: row.installmentCount,
      }))}
    />
  );
}
