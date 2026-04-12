import { NextRequest, NextResponse } from "next/server";
import {
  generateAdminToken,
  getAdminCookieName,
  validateAdminCredentials,
} from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
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
