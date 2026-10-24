import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { auth } from "./auth";

export type SessionUser = {
  id: string;
  name: string;
  role: string;
  plan: string;
  phone: string;
  email: string | null;
};

/** Utilisateur connecté, ou redirection vers la connexion. */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  // Compte suspendu : accès bloqué côté serveur
  const db = await getDb();
  const rows = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (rows[0]?.suspendedAt) redirect("/suspendu");

  return {
    id: session.user.id,
    name: session.user.name ?? "",
    role: session.user.role ?? "user",
    plan: session.user.plan ?? "free",
    phone: session.user.phone ?? "",
    email: session.user.email ?? null,
  };
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/app");
  return user;
}

/** Lit l'utilisateur à jour depuis la base (plan, rôle, expiration). */
export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const db = await getDb();
  const rows = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    plan: row.plan,
    phone: row.phone,
    email: row.email,
  };
}
