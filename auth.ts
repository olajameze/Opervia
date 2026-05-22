import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { BRAND } from "@/lib/branding";
import { superAdminEmails } from "@/lib/super-admin";
import { authConfig } from "@/auth.config";
import {
  sendNewSignupAdminNotification,
  sendWelcomeEmail,
} from "@/lib/registration-emails";

import type { JWT } from "next-auth/jwt";

async function loadUserFlagsIntoToken(token: JWT) {
  if (!token.id) return;

  const user = await prisma.user.findUnique({
    where: { id: token.id },
    select: { isSuperAdmin: true, email: true },
  });

  if (!user) return;

  token.isSuperAdmin =
    user.isSuperAdmin || superAdminEmails().includes(user.email.toLowerCase());
}

async function loadMembershipIntoToken(token: JWT) {
  if (!token.id) return;

  const membership = await prisma.membership.findFirst({
    where: { userId: token.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (membership) {
    token.organizationId = membership.organizationId;
    token.role = membership.role;
    token.organizationName = membership.organization.name;
    token.subscriptionPlan = membership.organization.subscriptionPlan ?? undefined;
    token.subscriptionStatus = membership.organization.subscriptionStatus;
  } else {
    delete token.organizationId;
    delete token.role;
    delete token.organizationName;
    delete token.subscriptionPlan;
    delete token.subscriptionStatus;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).trim().toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user?.passwordHash) return null;
        if (user.frozenAt) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!valid) return null;

        if (!user.emailVerified) {
          const hasMembership = await prisma.membership.findFirst({
            where: { userId: user.id },
            select: { id: true },
          });

          if (!hasMembership) return null;

          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "credentials" && user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.trim().toLowerCase() },
          select: { emailVerified: true, id: true, frozenAt: true },
        });

        if (!dbUser || dbUser.frozenAt) return false;

        if (!dbUser.emailVerified) {
          const hasMembership = await prisma.membership.findFirst({
            where: { userId: dbUser.id },
            select: { id: true },
          });
          if (!hasMembership) return false;
        }
      }

      if (user.id) {
        const frozenMembership = await prisma.membership.findFirst({
          where: {
            userId: user.id,
            organization: { frozenAt: { not: null } },
          },
          select: { id: true },
        });
        if (frozenMembership) return false;
      }

      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        await loadUserFlagsIntoToken(token);
        await loadMembershipIntoToken(token);
      } else if (trigger === "update") {
        await loadUserFlagsIntoToken(token);
        await loadMembershipIntoToken(token);
      }

      return token;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email) return;

      console.log(`[${BRAND.name}] New user registered: ${user.email}`);

      const adminResult = await sendNewSignupAdminNotification({
        email: user.email,
        name: user.name ?? user.email,
        method: "google",
      });

      if (!adminResult.ok) {
        console.error(
          `[${BRAND.name}] Signup admin notification failed for ${user.email}: ${adminResult.error}`
        );
      }

      const welcomeResult = await sendWelcomeEmail({
        email: user.email,
        name: user.name ?? user.email,
      });

      if (!welcomeResult.ok) {
        console.error(
          `[${BRAND.name}] Welcome email failed for ${user.email}: ${welcomeResult.error}`
        );
      }
    },
  },
});
