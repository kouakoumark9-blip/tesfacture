import type { NextAuthConfig } from "next-auth";

/**
 * Configuration partagée (sans adaptateur de base de données ni bcrypt)
 * afin de pouvoir être utilisée dans le middleware (Edge runtime).
 */
export const authConfig = {
  pages: { signIn: "/connexion" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "user";
        token.plan = (user as { plan?: string }).plan ?? "free";
        token.name = user.name ?? token.name;
        token.phone = (user as { phone?: string }).phone;
      }
      if (trigger === "update" && session) {
        const s = session as { plan?: string; name?: string };
        if (s.plan) token.plan = s.plan;
        if (s.name) token.name = s.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as string) ?? "user";
        session.user.plan = (token.plan as string) ?? "free";
        session.user.phone = (token.phone as string) ?? "";
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLogged = Boolean(auth?.user);
      const isApp = pathname.startsWith("/app");
      const isAdmin = pathname.startsWith("/admin");

      if ((isApp || isAdmin) && !isLogged) return false;
      if (isAdmin && auth?.user?.role !== "admin") {
        return Response.redirect(new URL("/app", request.nextUrl));
      }
      if ((pathname === "/connexion" || pathname === "/inscription") && isLogged) {
        return Response.redirect(new URL("/app", request.nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
