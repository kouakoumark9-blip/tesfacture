import fs from "node:fs";
import path from "node:path";
import type { Client, Database, Document, Settings } from "./types";
import { addDays, today } from "./format";
import { makeSeed } from "./seed";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

let cache: Database | null = null;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function read(): Database {
  if (cache) return cache;
  ensureDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as Database;
      return cache;
    } catch {
      // fichier corrompu -> on repart du seed
    }
  }
  cache = makeSeed();
  persist(cache);
  return cache;
}

function persist(db: Database) {
  ensureDir();
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DB_FILE);
  cache = db;
}

export function db(): Database {
  return read();
}

export function save(db: Database) {
  persist(db);
}

export function getSettings(): Settings {
  return read().settings;
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const data = read();
  data.settings = { ...data.settings, ...patch };
  persist(data);
  return data.settings;
}

export function listClients(): Client[] {
  return [...read().clients].sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export function getClient(id: string): Client | undefined {
  return read().clients.find((c) => c.id === id);
}

export function saveClient(client: Client) {
  const data = read();
  const i = data.clients.findIndex((c) => c.id === client.id);
  if (i >= 0) data.clients[i] = client;
  else data.clients.push(client);
  persist(data);
}

export function deleteClient(id: string) {
  const data = read();
  data.clients = data.clients.filter((c) => c.id !== id);
  data.documents = data.documents.filter((d) => d.clientId !== id);
  persist(data);
}

export function listDocuments(): Document[] {
  return [...read().documents].sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));
}

export function listByType(type: "facture" | "devis"): Document[] {
  return listDocuments().filter((d) => d.type === type);
}

export function getDocument(id: string): Document | undefined {
  return read().documents.find((d) => d.id === id);
}

export function nextNumber(type: "facture" | "devis", issueDate = today()): string {
  const data = read();
  const settings = data.settings;
  const prefix = type === "facture" ? settings.invoicePrefix : settings.quotePrefix;
  const year = issueDate.slice(0, 4);
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  const max = data.documents
    .filter((d) => d.type === type)
    .map((d) => pattern.exec(d.number)?.[1])
    .filter(Boolean)
    .map((n) => parseInt(n as string, 10))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}-${year}-${String(max + 1).padStart(4, "0")}`;
}

export function saveDocument(doc: Document) {
  const data = read();
  const i = data.documents.findIndex((d) => d.id === doc.id);
  if (i >= 0) data.documents[i] = doc;
  else data.documents.push(doc);
  persist(data);
}

export function deleteDocument(id: string) {
  const data = read();
  data.documents = data.documents.filter((d) => d.id !== id);
  persist(data);
}

export function newId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Réinitialise la base avec les données de démonstration. */
export function resetDatabase() {
  cache = makeSeed();
  persist(cache);
}

export function defaultDates(settings: Settings, type: "facture" | "devis") {
  const issue = today();
  return {
    issueDate: issue,
    dueDate: addDays(issue, settings.paymentTerms),
    validUntil: addDays(issue, settings.quoteValidity),
    type,
  };
}
