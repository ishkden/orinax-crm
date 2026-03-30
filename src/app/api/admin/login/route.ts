import { NextRequest, NextResponse } from "next/server";
import { generateAdminToken, getAdminCookieName } from "@/lib/admin-auth";

const ADMIN_PASSWORD = "31338123133812";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  const token = generateAdminToken();
  const res = NextResponse.json({ ok: true });

  res.cookies.set(getAdminCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return res;
}
