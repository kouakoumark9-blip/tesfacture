"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { registerSchema, loginSchema } from "@/lib/schemas";
import { registerUser, normalizePhone } from "@/lib/auth-users";
import { checkRateLimit } from "@/lib/rate-limit";
import { getDb } from "@/db/client";
import { companies } from "@/db/schema";

export type FormState = { ok: boolean; error?: string; fieldErrors?: Record<string, string> };

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Vérifiez les champs indiqués.", fieldErrors };
  }

  const phone = normalizePhone(parsed.data.phone);
  const limit = checkRateLimit(`register:${phone}`, 5, 15 * 60 * 1000);
  if (!limit.ok) {
    return { ok: false, error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  const result = await registerUser({
    name: parsed.data.name,
    phone,
    password: parsed.data.password,
    email: parsed.data.email,
  });

  if (!result.ok) return { ok: false, error: result.error };

  // Profil d'entreprise vide prêt à être rempli
  const db = await getDb();
  await db.insert(companies).values({ userId: result.user.id }).onConflictDoNothing();

  try {
    await signIn("credentials", {
      phone,
      password: parsed.data.password,
      redirectTo: "/app/profil-entreprise?bienvenue=1",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Compte créé. Connectez-vous pour continuer." };
    }
    throw error; // redirection Next.js
  }

  return { ok: true };
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Vérifiez les champs indiqués.", fieldErrors };
  }

  const next = String(formData.get("suivant") ?? "") || "/app";

  try {
    await signIn("credentials", {
      phone: normalizePhone(parsed.data.phone),
      password: parsed.data.password,
      redirectTo: next.startsWith("/") ? next : "/app",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const message =
        error.type === "CredentialsSignin"
          ? "Numéro ou mot de passe incorrect."
          : "Connexion impossible. Réessayez.";
      return { ok: false, error: message };
    }
    throw error;
  }

  return { ok: true };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/connexion" });
}
