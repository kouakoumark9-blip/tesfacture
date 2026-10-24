import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { clients, companies, documents, installments } from "@/db/schema";
import type { Period } from "./period";
import {
  computeMetrics,
  monthlySeries,
  paymentBreakdown,
  topClientsByBilled,
  quoteConversion,
  type StatsDoc,
  type StatsInstallment,
} from "./stats";
import { todayISO } from "./format";

export type DashboardData = {
  metrics: ReturnType<typeof computeMetrics>;
  months: ReturnType<typeof monthlySeries>;
  payments: ReturnType<typeof paymentBreakdown>;
  topClients: ReturnType<typeof topClientsByBilled>;
  conversion: number | null;
  upcoming: UpcomingRow[];
  overdue: OverdueRow[];
  recent: RecentRow[];
  companyName: string;
  paymentNumbers: Record<string, string | undefined>;
};

export type UpcomingRow = {
  installmentId: string;
  label: string;
  amount: number;
  dueDate: string | null;
  documentId: string;
  documentNumber: string;
  clientName: string;
  clientPhone: string | null;
  paymentMethods: string[];
};

export type OverdueRow = UpcomingRow & { daysLate: number };

export type RecentRow = {
  id: string;
  number: string;
  type: string;
  status: string;
  total: number;
  clientName: string;
  issueDate: string;
};

export async function loadStats(userId: string): Promise<{
  docs: StatsDoc[];
  parts: StatsInstallment[];
  convertedQuotes: number;
}> {
  const db = await getDb();

  const rows = await db
    .select({
      doc: documents,
      clientName: clients.name,
    })
    .from(documents)
    .leftJoin(clients, eq(clients.id, documents.clientId))
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt));

  const docs: StatsDoc[] = rows.map(({ doc, clientName }) => ({
    id: doc.id,
    type: doc.type,
    status: doc.status,
    number: doc.number,
    total: Number(doc.total),
    clientId: doc.clientId,
    clientName: clientName ?? "Client supprimé",
    issueDate: doc.issueDate,
    dueDate: doc.dueDate,
    paymentMethods: doc.paymentMethods ?? [],
    createdAt: doc.createdAt.toISOString(),
  }));

  const partRows = await db
    .select({ installment: installments })
    .from(installments)
    .innerJoin(documents, eq(documents.id, installments.documentId))
    .where(eq(documents.userId, userId));

  const parts: StatsInstallment[] = partRows.map(({ installment }) => ({
    id: installment.id,
    documentId: installment.documentId,
    label: installment.label,
    amount: Number(installment.amount),
    dueDate: installment.dueDate,
    paidAt: installment.paidAt ? installment.paidAt.toISOString().slice(0, 10) : null,
    method: installment.method,
  }));

  const converted = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(documents)
    .where(and(eq(documents.userId, userId), eq(documents.type, "FAC"), isNotNull(documents.sourceDocumentId)));

  return { docs, parts, convertedQuotes: Number(converted[0]?.count ?? 0) };
}

export async function loadDashboard(userId: string, period: Period): Promise<DashboardData> {
  const { docs, parts, convertedQuotes } = await loadStats(userId);
  const db = await getDb();

  const docById = new Map(docs.map((d) => [d.id, d]));
  const today = todayISO();

  const clientRows = await db.select().from(clients).where(eq(clients.userId, userId));
  const clientById = new Map(clientRows.map((c) => [c.id, c]));

  const limitDate = new Date(`${today}T12:00:00Z`);
  limitDate.setUTCDate(limitDate.getUTCDate() + 7);
  const limitISO = limitDate.toISOString().slice(0, 10);

  const unpaid = parts.filter((p) => {
    const doc = docById.get(p.documentId);
    return Boolean(doc && doc.type === "FAC" && doc.status !== "cancelled" && !p.paidAt && p.dueDate);
  });

  const toRow = (part: StatsInstallment): UpcomingRow => {
    const doc = docById.get(part.documentId)!;
    const client = doc.clientId ? clientById.get(doc.clientId) : undefined;
    return {
      installmentId: part.id,
      label: part.label,
      amount: part.amount,
      dueDate: part.dueDate,
      documentId: doc.id,
      documentNumber: doc.number,
      clientName: doc.clientName,
      clientPhone: client?.phone ?? null,
      paymentMethods: doc.paymentMethods,
    };
  };

  const upcoming: UpcomingRow[] = unpaid
    .filter((p) => p.dueDate! >= today && p.dueDate! <= limitISO)
    .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1))
    .slice(0, 6)
    .map(toRow);

  const overdue: OverdueRow[] = unpaid
    .filter((p) => p.dueDate! < today)
    .sort((a, b) => (a.dueDate! < b.dueDate! ? 1 : -1))
    .slice(0, 6)
    .map((part) => ({
      ...toRow(part),
      daysLate: Math.max(
        0,
        Math.round(
          (new Date(`${today}T12:00:00Z`).getTime() - new Date(`${part.dueDate}T12:00:00Z`).getTime()) /
            86_400_000
        )
      ),
    }));

  const companyRows = await db
    .select()
    .from(companies)
    .where(eq(companies.userId, userId))
    .limit(1);
  const company = companyRows[0];

  return {
    metrics: computeMetrics(docs, parts, period),
    months: monthlySeries(docs, parts, 12),
    payments: paymentBreakdown(parts, period),
    topClients: topClientsByBilled(docs, period),
    conversion: quoteConversion(docs, convertedQuotes),
    upcoming,
    overdue,
    recent: docs.slice(0, 6).map((doc) => ({
      id: doc.id,
      number: doc.number,
      type: doc.type,
      status: doc.status,
      total: doc.total,
      clientName: doc.clientName,
      issueDate: doc.issueDate,
    })),
    companyName: company?.name ?? "",
    paymentNumbers: (company?.paymentNumbers ?? {}) as Record<string, string | undefined>,
  };
}
