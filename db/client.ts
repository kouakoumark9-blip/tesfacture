import fs from "node:fs";
import path from "node:path";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

type Global = typeof globalThis & {
  __tesfactureDb?: Promise<Db>;
  __tesfactureClose?: () => Promise<void>;
};

const g = globalThis as Global;

const MIGRATIONS_DIR = path.join(process.cwd(), "db", "migrations");

/**
 * Exécute les fichiers SQL de db/migrations non encore appliqués.
 * `exec` accepte plusieurs instructions séparées par « ; ».
 */
async function runMigrations(exec: (sql: string) => Promise<unknown>) {
  await exec(
    `CREATE TABLE IF NOT EXISTS _migrations (
       name text PRIMARY KEY,
       applied_at timestamptz NOT NULL DEFAULT now()
     );`
  );

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    const applied = await exec(`SELECT name FROM _migrations WHERE name = '${file}';`);
    // pg renvoie { rows }, pglite renvoie { rows } également
    const rows = (applied as { rows?: unknown[] })?.rows ?? [];
    if (rows.length > 0) continue;
    await exec(sql);
    await exec(`INSERT INTO _migrations (name) VALUES ('${file}') ON CONFLICT DO NOTHING;`);
    console.log(`[db] migration appliquée : ${file}`);
  }
}

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;

  if (url && !url.startsWith("pglite:")) {
    const pool = new Pool({
      connectionString: url,
      ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
      max: 5,
    });
    await runMigrations((sql) => pool.query(sql));
    g.__tesfactureClose = async () => {
      await pool.end();
    };
    return drizzlePg(pool, { schema }) as unknown as Db;
  }

  // Développement local sans serveur PostgreSQL : PGlite (PostgreSQL en WASM).
  const dataDir = process.env.PGLITE_DIR || path.join(process.cwd(), ".data", "pg");
  fs.mkdirSync(path.dirname(path.resolve(dataDir)), { recursive: true });
  const { PGlite } = await import("@electric-sql/pglite");
  const client = new PGlite(dataDir);
  await client.waitReady;
  await runMigrations((sql) => client.exec(sql));
  g.__tesfactureClose = async () => {
    await client.close();
  };
  return drizzlePglite(client, { schema }) as unknown as Db;
}

/** Retourne l'instance Drizzle (initialisée et migrée une seule fois). */
export function getDb(): Promise<Db> {
  if (!g.__tesfactureDb) {
    g.__tesfactureDb = createDb().catch((error) => {
      g.__tesfactureDb = undefined;
      throw error;
    });
  }
  return g.__tesfactureDb;
}

export { schema };
