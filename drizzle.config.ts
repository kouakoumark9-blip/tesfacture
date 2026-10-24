import type { Config } from "drizzle-kit";

/**
 * Configuration drizzle-kit (génération de migrations SQL).
 *
 *   npx drizzle-kit generate   # depuis db/schema.ts vers db/migrations
 *   npx drizzle-kit push       # applique directement sur la base (développement)
 *
 * L'application applique elle-même les fichiers de db/migrations au démarrage
 * (voir db/client.ts), ce qui évite d'oublier une étape de déploiement.
 */
export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
