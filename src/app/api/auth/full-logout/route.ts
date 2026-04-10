import { NextResponse } from "next/server";

// GET /api/auth/full-logout
// Delegates logout to my.orinax.ai which clears the shared .orinax.ai cookie.
export async function GET() {
  return NextResponse.redirect(
    "https://my.orinax.ai/api/auth/logout?callbackUrl=https://my.orinax.ai/login"
  );
}
