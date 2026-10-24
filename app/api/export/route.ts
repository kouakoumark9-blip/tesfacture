import { auth } from "@/lib/auth";
import { loadStats } from "@/lib/dashboard";
import { resolvePeriod, inRange } from "@/lib/period";
import { effectivePlan, PLANS } from "@/lib/plan";

export const dynamic = "force-dynamic";

function escapeCsv(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Connexion requise.", { status: 401 });
  }

  const plan = await effectivePlan(session.user.id);
  if (plan !== "business") {
    return new Response(
      `L'export CSV est réservé au plan Business (${PLANS.business.price} FCFA/mois).`,
      { status: 402 }
    );
  }

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") === "payments" ? "payments" : "documents";
  const period = resolvePeriod(
    url.searchParams.get("period") ?? "month",
    url.searchParams.get("from"),
    url.searchParams.get("to")
  );

  const { docs, parts } = await loadStats(session.user.id);
  const docById = new Map(docs.map((d) => [d.id, d]));

  let rows: string[][];
  if (kind === "documents") {
    rows = [["Numéro", "Type", "Statut", "Client", "Date", "Échéance", "Total FCFA", "Payé FCFA", "Reste FCFA"]];
    for (const doc of docs.filter((d) => inRange(d.issueDate, period))) {
      const paid = parts
        .filter((p) => p.documentId === doc.id && p.paidAt)
        .reduce((sum, p) => sum + p.amount, 0);
      rows.push([
        doc.number,
        doc.type,
        doc.status,
        doc.clientName,
        doc.issueDate,
        doc.dueDate ?? "",
        String(doc.total),
        String(paid),
        String(Math.max(0, doc.total - paid)),
      ]);
    }
  } else {
    rows = [["Date de paiement", "Document", "Client", "Tranche", "Montant FCFA", "Moyen"]];
    for (const part of parts.filter((p) => p.paidAt && inRange(p.paidAt, period))) {
      const doc = docById.get(part.documentId);
      rows.push([
        part.paidAt ?? "",
        doc?.number ?? "",
        doc?.clientName ?? "",
        part.label,
        String(part.amount),
        part.method ?? "",
      ]);
    }
  }

  const csv = rows.map((row) => row.map(escapeCsv).join(";")).join("\r\n");
  const filename = `tesfacture-${kind}-${period.start}_${period.end}.csv`;

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
