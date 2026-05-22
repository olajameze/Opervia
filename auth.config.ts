import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

// Edge-safe NextAuth config — no Prisma, no bcrypt, no Node-only modules.
// Used by middleware.ts so the Edge Function bundle stays under 1 MB.
// The full config in auth.ts spreads this and adds the Prisma adapter +
// Credentials provider + heavy JWT callback for the Node runtime.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  providers: [],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.organizationId = token.organizationId as string | undefined;
        session.user.role = token.role as Role | undefined;
        session.user.organizationName = token.organizationName as string | undefined;
        session.user.isSuperAdmin = Boolean(token.isSuperAdmin);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
