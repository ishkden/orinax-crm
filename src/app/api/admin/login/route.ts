import { NextRequest, NextResponse } from "next/server";
import {
  generateAdminToken,
  getAdminCookieName,
  validateAdminCredentials,
} from "@/lib/admin-auth";
import { rateLimitByIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const rl = rateLimitByIp(ip, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте позже." },
      { status: 429 },
    );
  }

  const { email, password } = await req.json();

  if (!email || !password || !validateAdminCredentials(email, password)) {
    return NextResponse.json(
      { error: "Неверный email или пароль" },
      { status: 401 },
    );
  }

  const token = generateAdminToken();
  const res = NextResponse.json({ ok: true });

  res.cookies.set(getAdminCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
