import { NextResponse } from "next/server";

// GET /api/auth/full-logout
// Delegates logout to analytics.orinax.ai (crm-app) which owns the shared
// NextAuth cookie on .orinax.ai; clearing it there signs the user out of
// every service (analytics, crm, connector).
export async function GET() {
  return NextResponse.redirect(
    "https://analytics.orinax.ai/api/auth/logout?callbackUrl=https://analytics.orinax.ai/login"
  );
}
