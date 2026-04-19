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

// CRM reads the shared NextAuth cookie issued by analytics (crm-app).
// NEXTAUTH_SECRET and COOKIE_DOMAIN MUST be identical on every service
// under *.orinax.ai (analytics, crm, connector) — otherwise the JWT will
// not decode and users appear logged-out.
// No local login — signIn always redirects to analytics.orinax.ai.
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "https://analytics.orinax.ai/login" },
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
      // Pass through — token already contains all fields from the analytics (crm-app) JWT.
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

      u.role = token.role as string;
      u.permissions = (token as any).permissions ?? null;

      const analyticsOrgId = token.orgId as string | null;
      u.externalOrgId = analyticsOrgId;

      const allowedRoles = ["OWNER", "ADMIN", "MANAGER"] as const;
      const memberRole = allowedRoles.includes(
        (token.role as (typeof allowedRoles)[number])
      )
        ? (token.role as (typeof allowedRoles)[number])
        : "AGENT";

      if (analyticsOrgId) {
        // Use analyticsOrgId as CRM org id — single ID across all services
        let crmOrg = await prisma.org.findFirst({
          where: { externalId: analyticsOrgId },
          select: { id: true },
        });

        if (!crmOrg && token.email) {
          crmOrg = await prisma.org.upsert({
            where: { externalId: analyticsOrgId },
            update: {},
            create: {
              id: analyticsOrgId,
              externalId: analyticsOrgId,
              name: "Organization",
              slug: slugify(`org-${analyticsOrgId}`),
            },
            select: { id: true },
          });
        }

        u.orgId = crmOrg?.id ?? null;

        // Resolve CRM-local user by email (JWT id is analytics-side)
        if (crmOrg && token.email) {
          let crmUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { id: true },
          });

          if (!crmUser) {
            crmUser = await prisma.user.create({
              data: {
                email: token.email as string,
                name: (token.name as string) ?? (token.email as string),
              },
              select: { id: true },
            });
          }

          await prisma.orgMember.upsert({
            where: { userId_orgId: { userId: crmUser.id, orgId: crmOrg.id } },
            update: {},
            create: { userId: crmUser.id, orgId: crmOrg.id, role: memberRole },
          });

          u.id = crmUser.id;
        } else {
          u.id = (token.id as string) ?? token.sub;
        }
      } else {
        u.orgId = null;
        u.id = (token.id as string) ?? token.sub;
      }

      return session;
    },
  },
};
