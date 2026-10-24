import { requireUser } from "@/lib/session";
import { listDocuments } from "@/lib/documents";
import DocumentsList from "@/components/documents-list";

export const metadata = { title: "Documents — FactureCI" };
export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const user = await requireUser();
  const rows = await listDocuments(user.id);

  return (
    <DocumentsList
      showTypeFilter
      title="Tous mes documents"
      subtitle="Factures, devis et bons de livraison"
      createHref="/app/documents/nouveau"
      createLabel="Nouveau"
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
