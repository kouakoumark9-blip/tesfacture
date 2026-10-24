import { loadEnv } from "./env";

loadEnv();

async function main() {
  const { getDb } = await import("../db/client");
  await getDb();
  console.log("✓ Migrations appliquées.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Migration échouée :", error);
  process.exit(1);
});
