import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { generateAdminToken, getAdminCookieName } from "@/lib/admin-auth";

// GET /api/auth/admin-sso
// Grants admin panel access by verifying the shared *.orinax.ai NextAuth cookie.
// No SSO token needed — role is read directly from the shared session.
export async function GET(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
  });

  if (!token?.email) {
    return NextResponse.redirect(new URL("https://my.orinax.ai/login?callbackUrl=https://crm.orinax.ai/api/auth/admin-sso"));
  }

  const role = token.role as string | undefined;
  const adminEmail = process.env.ADMIN_EMAIL;
  const isAllowed =
    (adminEmail && token.email === adminEmail) ||
    role === "OWNER" ||
    role === "ADMIN";

  if (!isAllowed) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const adminToken = generateAdminToken();
  const redirectUrl = new URL(
    "/admin/dashboard",
    process.env.NEXTAUTH_URL || "https://crm.orinax.ai"
  );
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set(getAdminCookieName(), adminToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
