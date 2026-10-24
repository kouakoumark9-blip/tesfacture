import { requireUser } from "@/lib/session";
import { listDocuments } from "@/lib/documents";
import DocumentsList from "@/components/documents-list";

export const metadata = { title: "Bons de livraison — TesFacture" };
export const dynamic = "force-dynamic";

export default async function LivraisonsPage() {
  const user = await requireUser();
  const rows = await listDocuments(user.id, { type: "BL" });

  return (
    <DocumentsList
      type="BL"
      title="Bons de livraison"
      subtitle={`${rows.length} bon${rows.length > 1 ? "s" : ""} de livraison · sans montant ni TVA`}
      createHref="/app/documents/nouveau?type=BL"
      createLabel="Nouveau bon"
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
