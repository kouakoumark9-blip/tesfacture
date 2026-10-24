import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { findUserByPhone, verifyPassword, normalizePhone } from "./auth-users";
import { checkRateLimit, resetRateLimit } from "./rate-limit";

const credentialsSchema = z.object({
  phone: z.string().min(8, "Numéro de téléphone invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Téléphone",
      credentials: {
        phone: { label: "Téléphone", type: "tel" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const phone = normalizePhone(parsed.data.phone);
        const limit = checkRateLimit(`login:${phone}`, 8, 10 * 60 * 1000);
        if (!limit.ok) {
          throw new Error("Trop de tentatives. Réessayez dans quelques minutes.");
        }

        const user = await findUserByPhone(phone);
        if (!user) return null;

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        resetRateLimit(`login:${phone}`);

        return {
          id: user.id,
          name: user.name,
          email: user.email ?? undefined,
          role: user.role,
          plan: user.plan,
          phone: user.phone,
        };
      },
    }),
  ],
});
