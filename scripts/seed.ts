import { loadEnv } from "./env";

loadEnv();

async function main() {
  const { getDb } = await import("../db/client");
  const { users, companies } = await import("../db/schema");
  const { normalizePhone, hashPassword } = await import("../lib/auth-users");
  const { eq } = await import("drizzle-orm");

  const adminPhone = normalizePhone((process.env.ADMIN_PHONES || "0700000000").split(",")[0]);
  const password = process.env.ADMIN_PASSWORD || "Admin1234!";
  const name = process.env.ADMIN_NAME || "Administrateur TesFacture";

  const db = await getDb();

  const existing = await db.select().from(users).where(eq(users.phone, adminPhone)).limit(1);

  if (existing[0]) {
    await db
      .update(users)
      .set({
        role: "admin",
        passwordHash: await hashPassword(password),
        plan: "business",
        planExpiresAt: new Date(Date.now() + 365 * 86_400_000),
      })
      .where(eq(users.id, existing[0].id));
    console.log(`✓ Compte admin existant mis à jour : ${adminPhone}`);
  } else {
    const inserted = await db
      .insert(users)
      .values({
        phone: adminPhone,
        name,
        role: "admin",
        plan: "business",
        planExpiresAt: new Date(Date.now() + 365 * 86_400_000),
        passwordHash: await hashPassword(password),
      })
      .returning();

    await db
      .insert(companies)
      .values({
        userId: inserted[0].id,
        name: "TesFacture",
        rccm: "CI-ABJ-2026-B-00001",
        taxNumber: "CI-2026-000001-A",
        address: "Abidjan, Côte d'Ivoire",
        phone: adminPhone.replace("+225", ""),
      })
      .onConflictDoNothing();

    console.log(`✓ Compte admin créé : ${adminPhone} / ${password}`);
  }

  console.log("Seed terminé. Connectez-vous sur /connexion.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed échoué :", error);
  process.exit(1);
});
