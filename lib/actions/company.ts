"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { companies } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { companySchema } from "@/lib/schemas";

export type CompanyState = { ok: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> };

export async function saveCompanyAction(
  _prev: CompanyState,
  formData: FormData
): Promise<CompanyState> {
  const user = await requireUser();

  const raw = {
    name: String(formData.get("name") ?? ""),
    logo: String(formData.get("logo") ?? ""),
    rccm: String(formData.get("rccm") ?? ""),
    taxNumber: String(formData.get("taxNumber") ?? ""),
    address: String(formData.get("address") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    defaultNote: String(formData.get("defaultNote") ?? ""),
    paymentNumbers: {
      wave: String(formData.get("wave") ?? ""),
      orange: String(formData.get("orange") ?? ""),
      mtn: String(formData.get("mtn") ?? ""),
      moov: String(formData.get("moov") ?? ""),
    },
  };

  const parsed = companySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Vérifiez les champs indiqués.", fieldErrors };
  }

  const values = {
    name: parsed.data.name,
    logo: parsed.data.logo || null,
    rccm: parsed.data.rccm || null,
    taxNumber: parsed.data.taxNumber || null,
    address: parsed.data.address || null,
    phone: parsed.data.phone || null,
    defaultNote: parsed.data.defaultNote || null,
    paymentNumbers: {
      wave: parsed.data.paymentNumbers?.wave || undefined,
      orange: parsed.data.paymentNumbers?.orange || undefined,
      mtn: parsed.data.paymentNumbers?.mtn || undefined,
      moov: parsed.data.paymentNumbers?.moov || undefined,
    },
  };

  const db = await getDb();
  await db
    .insert(companies)
    .values({ userId: user.id, ...values })
    .onConflictDoUpdate({ target: companies.userId, set: values });

  revalidatePath("/app/profil-entreprise");
  revalidatePath("/app");

  return { ok: true, message: "Profil de l'entreprise enregistré." };
}

export async function getCompany(userId: string) {
  const db = await getDb();
  const rows = await db.select().from(companies).where(eq(companies.userId, userId)).limit(1);
  return rows[0] ?? null;
}
