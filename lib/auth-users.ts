import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";

/** Formate un numéro ivoirien : 0700000000 -> +2250700000000 */
export function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("225")) return `+${digits}`;
  if (digits.startsWith("00225")) return `+${digits.slice(2)}`;
  if (digits.length === 10) return `+225${digits}`;
  return `+${digits}`;
}

/** +2250700000000 -> 07 00 00 00 00 */
export function formatPhone(value: string): string {
  const digits = (value || "").replace(/\D/g, "");
  const local = digits.startsWith("225") ? digits.slice(3) : digits;
  return local.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

/** Le numéro local sur 10 chiffres, pour les liens wa.me / sms: */
export function phoneLocal(value: string): string {
  const digits = (value || "").replace(/\D/g, "");
  return digits.startsWith("225") ? digits.slice(3) : digits;
}

export function adminPhones(): string[] {
  return (process.env.ADMIN_PHONES || "")
    .split(",")
    .map((p) => normalizePhone(p.trim()))
    .filter(Boolean);
}

export function isAdminPhone(phone: string): boolean {
  return adminPhones().includes(normalizePhone(phone));
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export async function findUserByPhone(phone: string) {
  const db = await getDb();
  const normalized = normalizePhone(phone);
  const rows = await db.select().from(users).where(eq(users.phone, normalized)).limit(1);
  return rows[0] ?? null;
}

export async function findUserById(id: string) {
  const db = await getDb();
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function registerUser(input: {
  name: string;
  phone: string;
  password: string;
  email?: string;
}) {
  const db = await getDb();
  const phone = normalizePhone(input.phone);
  const existing = await findUserByPhone(phone);
  if (existing) {
    return { ok: false as const, error: "Ce numéro est déjà utilisé. Connectez-vous." };
  }
  const passwordHash = await hashPassword(input.password);
  const inserted = await db
    .insert(users)
    .values({
      name: input.name.trim(),
      phone,
      email: input.email?.trim() || null,
      passwordHash,
      role: isAdminPhone(phone) ? "admin" : "user",
    })
    .returning();

  return { ok: true as const, user: inserted[0] };
}
