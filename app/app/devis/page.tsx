import { requireUser } from "@/lib/session";
import { listDocuments } from "@/lib/documents";
import DocumentsList from "@/components/documents-list";

export const metadata = { title: "Devis — FactureCI" };
export const dynamic = "force-dynamic";

export default async function DevisPage() {
  const user = await requireUser();
  const rows = await listDocuments(user.id, { type: "DEV" });
  const total = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <DocumentsList
      type="DEV"
      title="Devis"
      subtitle={`${rows.length} devis · ${new Intl.NumberFormat("fr-FR").format(total)} FCFA proposés`}
      createHref="/app/documents/nouveau?type=DEV"
      createLabel="Nouveau devis"
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
