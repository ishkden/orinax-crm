import { NextAuthOptions } from "next-auth";
import { prisma } from "./prisma";

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
const cookiePrefix = useSecureCookies ? "__Secure-" : "";
const cookieDomain = process.env.COOKIE_DOMAIN || ".orinax.ai";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

// CRM reads the shared NextAuth cookie issued by my.orinax.ai.
// NEXTAUTH_SECRET must be identical on both services.
// No local login — signIn always redirects to my.orinax.ai.
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "https://my.orinax.ai/login" },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        domain: cookieDomain,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: {
        domain: cookieDomain,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: `${cookiePrefix}next-auth.csrf-token`,
      options: {
        domain: cookieDomain,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  providers: [],
  callbacks: {
    async jwt({ token }) {
      // Pass through — token already contains all fields from my.orinax.ai JWT.
      return token;
    },
    async session({ session, token }) {
      if (!token || !session.user) return session;

      const u = session.user as {
        id?: string;
        role?: string;
        orgId?: string | null;
        externalOrgId?: string | null;
        permissions?: unknown;
      };

      u.id = (token.id as string) ?? token.sub;
      u.role = token.role as string;
      u.permissions = (token as any).permissions ?? null;

      // token.orgId = analytics orgId → look up / provision CRM-local org
      const analyticsOrgId = token.orgId as string | null;
      u.externalOrgId = analyticsOrgId;

      if (analyticsOrgId) {
        // Fast path: org already provisioned
        let crmOrg = await prisma.org.findFirst({
          where: { externalId: analyticsOrgId },
          select: { id: true },
        });

        // First visit: auto-provision org + user + membership
        if (!crmOrg && token.email) {
          crmOrg = await prisma.org.upsert({
            where: { externalId: analyticsOrgId },
            update: {},
            create: {
              externalId: analyticsOrgId,
              name: "Organization",
              slug: slugify(`org-${analyticsOrgId}`),
            },
            select: { id: true },
          });

          const crmUser = await prisma.user.upsert({
            where: { email: token.email as string },
            update: {},
            create: {
              email: token.email as string,
              name: (token.name as string) ?? (token.email as string),
            },
            select: { id: true },
          });

          const allowedRoles = ["OWNER", "ADMIN", "MANAGER"] as const;
          const memberRole = allowedRoles.includes(
            (token.role as (typeof allowedRoles)[number])
          )
            ? (token.role as (typeof allowedRoles)[number])
            : "AGENT";

          await prisma.orgMember.upsert({
            where: { userId_orgId: { userId: crmUser.id, orgId: crmOrg.id } },
            update: {},
            create: { userId: crmUser.id, orgId: crmOrg.id, role: memberRole },
          });
        }

        u.orgId = crmOrg?.id ?? null;
      } else {
        u.orgId = null;
      }

      return session;
    },
  },
};
