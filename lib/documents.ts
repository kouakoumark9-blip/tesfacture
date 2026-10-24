import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  clients,
  companies,
  documentItems,
  documents,
  installments,
  counters,
  type Client,
  type Company,
  type Document,
  type DocumentItem,
  type Installment,
} from "@/db/schema";
import { todayISO } from "./format";
import { computeStatus, type DocStatus } from "./calc";

export type DocType = "FAC" | "DEV" | "BL";

export type DocumentBundle = {
  doc: Document;
  items: DocumentItem[];
  installments: Installment[];
  client: Client | null;
  company: Company | null;
};

/** Numérotation TYPE-ANNÉE-000N, atomique par utilisateur / type / année. */
export async function nextNumber(userId: string, type: DocType, year: number): Promise<string> {
  const db = await getDb();
  const rows = await db
    .insert(counters)
    .values({ userId, type, year, lastNumber: 1 })
    .onConflictDoUpdate({
      target: [counters.userId, counters.type, counters.year],
      set: { lastNumber: sql`${counters.lastNumber} + 1` },
    })
    .returning({ lastNumber: counters.lastNumber });

  const n = rows[0]?.lastNumber ?? 1;
  return `${type}-${year}-${String(n).padStart(3, "0")}`;
}

/** Affiche le prochain numéro sans l'incrémenter (aperçu du formulaire). */
export async function peekNumber(userId: string, type: DocType, year: number): Promise<string> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(counters)
    .where(and(eq(counters.userId, userId), eq(counters.type, type), eq(counters.year, year)))
    .limit(1);
  const next = (rows[0]?.lastNumber ?? 0) + 1;
  return `${type}-${year}-${String(next).padStart(3, "0")}`;
}

export function newShareToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(18)))
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 24);
}

/** Recalcule et enregistre le statut d'un document d'après ses tranches. */
export async function refreshStatus(documentId: string): Promise<DocStatus | null> {
  const db = await getDb();
  const rows = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
  const doc = rows[0];
  if (!doc) return null;

  const parts = await db
    .select()
    .from(installments)
    .where(eq(installments.documentId, documentId))
    .orderBy(asc(installments.position));

  const next = computeStatus(
    doc.status as DocStatus,
    parts.map((p) => ({ amount: Number(p.amount), dueDate: p.dueDate, paidAt: p.paidAt })),
    todayISO()
  );

  if (next !== doc.status) {
    await db.update(documents).set({ status: next }).where(eq(documents.id, documentId));
  }
  return next;
}

export async function getDocumentForUser(
  documentId: string,
  userId: string
): Promise<DocumentBundle | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.userId, userId)))
    .limit(1);
  const doc = rows[0];
  if (!doc) return null;

  const [items, parts, clientRows, companyRows] = await Promise.all([
    db
      .select()
      .from(documentItems)
      .where(eq(documentItems.documentId, documentId))
      .orderBy(asc(documentItems.position)),
    db
      .select()
      .from(installments)
      .where(eq(installments.documentId, documentId))
      .orderBy(asc(installments.position)),
    doc.clientId
      ? db.select().from(clients).where(eq(clients.id, doc.clientId)).limit(1)
      : Promise.resolve([]),
    db.select().from(companies).where(eq(companies.userId, userId)).limit(1),
  ]);

  return {
    doc,
    items,
    installments: parts,
    client: clientRows[0] ?? null,
    company: companyRows[0] ?? null,
  };
}

export async function getDocumentByToken(token: string): Promise<DocumentBundle | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(documents)
    .where(eq(documents.shareToken, token))
    .limit(1);
  const doc = rows[0];
  if (!doc) return null;

  const [items, parts, clientRows, companyRows] = await Promise.all([
    db
      .select()
      .from(documentItems)
      .where(eq(documentItems.documentId, doc.id))
      .orderBy(asc(documentItems.position)),
    db
      .select()
      .from(installments)
      .where(eq(installments.documentId, doc.id))
      .orderBy(asc(installments.position)),
    doc.clientId
      ? db.select().from(clients).where(eq(clients.id, doc.clientId)).limit(1)
      : Promise.resolve([]),
    db.select().from(companies).where(eq(companies.userId, doc.userId)).limit(1),
  ]);

  return {
    doc,
    items,
    installments: parts,
    client: clientRows[0] ?? null,
    company: companyRows[0] ?? null,
  };
}

export type ListFilters = {
  type?: DocType;
  status?: string;
  query?: string;
  limit?: number;
};

export type DocumentListItem = {
  doc: Document;
  total: number;
  clientName: string;
  paidCount: number;
  installmentCount: number;
};

export async function listDocuments(
  userId: string,
  filters: ListFilters = {}
): Promise<DocumentListItem[]> {
  const db = await getDb();

  const conditions = [eq(documents.userId, userId)];
  if (filters.type) conditions.push(eq(documents.type, filters.type));
  if (filters.status && filters.status !== "all") {
    conditions.push(eq(documents.status, filters.status));
  }
  if (filters.query) {
    const q = `%${filters.query.toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${documents.number})`, q),
        like(sql`lower(coalesce(${clients.name}, ''))`, q)
      )!
    );
  }

  const rows = await db
    .select({
      doc: documents,
      clientName: clients.name,
      paidCount: sql<number>`(
        select count(*) from ${installments}
        where ${installments.documentId} = ${documents.id} and ${installments.paidAt} is not null
      )`,
      installmentCount: sql<number>`(
        select count(*) from ${installments} where ${installments.documentId} = ${documents.id}
      )`,
    })
    .from(documents)
    .leftJoin(clients, eq(clients.id, documents.clientId))
    .where(and(...conditions))
    .orderBy(desc(documents.createdAt))
    .limit(filters.limit ?? 200);

  return rows.map((row) => ({
    doc: row.doc,
    total: Number(row.doc.total),
    clientName: row.clientName ?? "Client supprimé",
    paidCount: Number(row.paidCount),
    installmentCount: Number(row.installmentCount),
  }));
}

export async function listClients(userId: string): Promise<Client[]> {
  const db = await getDb();
  return db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId))
    .orderBy(asc(clients.name));
}

export async function findClients(userId: string, query: string, limit = 8): Promise<Client[]> {
  const db = await getDb();
  const q = `%${query.toLowerCase()}%`;
  return db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.userId, userId),
        or(like(sql`lower(${clients.name})`, q), like(sql`lower(coalesce(${clients.phone}, ''))`, q))!
      )
    )
    .limit(limit);
}

export async function getCompanyForUser(userId: string): Promise<Company | null> {
  const db = await getDb();
  const rows = await db.select().from(companies).where(eq(companies.userId, userId)).limit(1);
  return rows[0] ?? null;
}

/** Tranches impayées arrivant à échéance dans les prochains jours. */
export async function upcomingInstallments(userId: string, withinDays = 7) {
  const db = await getDb();
  const today = todayISO();
  const limitDate = new Date(`${today}T12:00:00Z`);
  limitDate.setUTCDate(limitDate.getUTCDate() + withinDays);
  const limit = limitDate.toISOString().slice(0, 10);

  return db
    .select({
      installment: installments,
      doc: documents,
      clientName: clients.name,
      clientPhone: clients.phone,
    })
    .from(installments)
    .innerJoin(documents, eq(documents.id, installments.documentId))
    .leftJoin(clients, eq(clients.id, documents.clientId))
    .where(
      and(
        eq(documents.userId, userId),
        inArray(documents.type, ["FAC"]),
        sql`${installments.paidAt} is null`,
        sql`${installments.dueDate} >= ${today}`,
        sql`${installments.dueDate} <= ${limit}`
      )
    )
    .orderBy(asc(installments.dueDate));
}

/** Tranches en retard, les plus anciennes d'abord. */
export async function overdueInstallments(userId: string) {
  const db = await getDb();
  const today = todayISO();
  return db
    .select({
      installment: installments,
      doc: documents,
      clientName: clients.name,
      clientPhone: clients.phone,
    })
    .from(installments)
    .innerJoin(documents, eq(documents.id, installments.documentId))
    .leftJoin(clients, eq(clients.id, documents.clientId))
    .where(
      and(
        eq(documents.userId, userId),
        inArray(documents.type, ["FAC"]),
        sql`${installments.paidAt} is null`,
        sql`${installments.dueDate} < ${today}`
      )
    )
    .orderBy(asc(installments.dueDate));
}
