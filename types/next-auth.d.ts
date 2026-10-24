import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    plan?: string;
    phone?: string;
  }
  interface Session {
    user: {
      id: string;
      role: string;
      plan: string;
      phone: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    plan?: string;
    phone?: string;
  }
}
