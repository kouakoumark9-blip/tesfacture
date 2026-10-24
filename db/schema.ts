import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/** Utilisateurs : téléphone + mot de passe (e-mail facultatif). */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // user | admin
  plan: text("plan").notNull().default("free"), // free | pro | business
  planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Profil de l'entreprise (une par utilisateur). */
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name"),
  logo: text("logo"), // data URL, redimensionnée à 240 px côté client
  rccm: text("rccm"),
  taxNumber: text("tax_number"), // compte contribuable
  address: text("address"),
  phone: text("phone"),
  paymentNumbers: jsonb("payment_numbers")
    .$type<{
      wave?: string;
      orange?: string;
      mtn?: string;
      moov?: string;
    }>()
    .notNull()
    .default({}),
  defaultNote: text("default_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("clients_user_idx").on(t.userId)]
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    type: text("type").notNull(), // FAC | DEV | BL
    number: text("number").notNull(),
    status: text("status").notNull().default("draft"),
    // draft | sent | partial | paid | overdue | cancelled | delivered
    issueDate: text("issue_date").notNull(), // date ISO (YYYY-MM-DD)
    dueDate: text("due_date"),
    discountPercent: numeric("discount_percent", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    vatPercent: numeric("vat_percent", { precision: 5, scale: 2 }).notNull().default("0"),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
    discountAmount: numeric("discount_amount", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    vatAmount: numeric("vat_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
    note: text("note"),
    paymentMethods: jsonb("payment_methods").$type<string[]>().notNull().default([]),
    deliveryAddress: text("delivery_address"),
    deliveredBy: text("delivered_by"),
    sourceDocumentId: uuid("source_document_id"),
    shareToken: text("share_token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("documents_user_idx").on(t.userId),
    unique("documents_user_number_idx").on(t.userId, t.number),
  ]
);

export const documentItems = pgTable(
  "document_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull().default("1"),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull().default("0"),
  },
  (t) => [index("document_items_document_idx").on(t.documentId)]
);

export const installments = pgTable(
  "installments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    label: text("label").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    dueDate: text("due_date"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    method: text("method"),
  },
  (t) => [index("installments_document_idx").on(t.documentId)]
);

export const paymentRequests = pgTable(
  "payment_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    plan: text("plan").notNull(), // pro | business
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    reference: text("reference").notNull(),
    status: text("status").notNull().default("pending"), // pending | validated | rejected
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
  },
  (t) => [index("payment_requests_user_idx").on(t.userId)]
);

/** Compteurs de numérotation : un par utilisateur, type et année. */
export const counters = pgTable(
  "counters",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    year: integer("year").notNull(),
    lastNumber: integer("last_number").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.type, t.year] })]
);

/** Journal des actions administrateur. */
export const adminActions = pgTable(
  "admin_actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    targetUserId: uuid("target_user_id"),
    targetId: text("target_id"),
    details: text("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("admin_actions_admin_idx").on(t.adminId)]
);

export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type DocumentItem = typeof documentItems.$inferSelect;
export type Installment = typeof installments.$inferSelect;
export type PaymentRequest = typeof paymentRequests.$inferSelect;
