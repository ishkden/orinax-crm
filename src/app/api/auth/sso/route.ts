import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

interface SsoTokenPayload {
  orgId: string;
  orgName?: string;
  email: string;
  name?: string;
  role?: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  if (!process.env.SSO_SECRET_KEY) {
    console.error("[SSO] SSO_SECRET_KEY is not configured");
    return NextResponse.json({ error: "SSO not configured" }, { status: 500 });
  }

  // ── 1. Validate incoming SSO JWT ───────────────────────────────────────────
  let payload: SsoTokenPayload;
  try {
    const secret = new TextEncoder().encode(process.env.SSO_SECRET_KEY);
    const { payload: decoded } = await jwtVerify(token, secret);
    payload = decoded as unknown as SsoTokenPayload;
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const { orgId, orgName, email, name, role } = payload;

  if (!orgId || !email) {
    return NextResponse.json(
      { error: "Token missing required fields: orgId, email" },
      { status: 401 }
    );
  }

  // ── 2. Sync DB: Org ────────────────────────────────────────────────────────
  const orgSlug = slugify(`org-${orgId}`);

  const org = await prisma.org.upsert({
    where: { externalId: orgId },
    update: {},
    create: {
      externalId: orgId,
      name: orgName ?? `Organization ${orgId}`,
      slug: orgSlug,
    },
  });

  // ── 3. Sync DB: User ───────────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { email },
    update: { name: name ?? undefined },
    create: {
      email,
      name: name ?? email,
    },
  });

  // ── 4. Sync DB: OrgMember ──────────────────────────────────────────────────
  await prisma.orgMember.upsert({
    where: { userId_orgId: { userId: user.id, orgId: org.id } },
    update: {},
    create: {
      userId: user.id,
      orgId: org.id,
      role: role === "OWNER" || role === "ADMIN" || role === "MANAGER" ? role : "AGENT",
    },
  });

  // ── 5. Mint NextAuth-compatible session JWT ────────────────────────────────
  const sessionMaxAgeSec = 30 * 24 * 60 * 60; // 30 days

  const sessionToken = await encode({
    token: {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + sessionMaxAgeSec,
    },
    secret: process.env.NEXTAUTH_SECRET!,
    maxAge: sessionMaxAgeSec,
  });

  // ── 6. Set cookie + redirect ───────────────────────────────────────────────
  const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
  const cookieName = `${useSecureCookies ? "__Secure-" : ""}next-auth.session-token`;

  const redirectUrl = new URL("/crm/deals", req.url);
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: useSecureCookies,
    maxAge: sessionMaxAgeSec,
  });

  return response;
}
