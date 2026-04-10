import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/api/auth", "/api/v1", "/api/admin", "/admin", "/_next", "/favicon.ico"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
  });

  if (!token) {
    const callbackUrl = encodeURIComponent(
      `https://crm.orinax.ai${pathname}`
    );
    return NextResponse.redirect(
      `https://my.orinax.ai/login?callbackUrl=${callbackUrl}`
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2|woff|ttf|otf)).*)"],
};
