import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/v1", "/api/admin", "/admin", "/_next", "/favicon.ico"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // #region agent log
  const actionId = req.headers.get("Next-Action");
  if (actionId) {
    console.error(`[CRM-DEBUG-054ca9] Next-Action header detected: action="${actionId}" path=${pathname} method=${req.method} ua=${req.headers.get("user-agent")?.slice(0,80)}`);
  }
  // #endregion

  if (isPublic(pathname)) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    // Use env var instead of req.nextUrl.protocol — behind nginx the request
    // is always http:// even for HTTPS connections, so protocol detection fails.
    secureCookie: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
  });

  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
