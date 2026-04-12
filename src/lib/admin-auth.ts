import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const COOKIE_NAME = "orinax_admin_token";
const HMAC_KEY = process.env.NEXTAUTH_SECRET || "fallback-admin-secret";

function signToken(email: string): string {
  const payload = `${email}:${Date.now()}`;
  const sig = createHmac("sha256", HMAC_KEY).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifyToken(token: string): boolean {
  if (!ADMIN_SECRET || !token) return false;
  const dotIdx = token.lastIndexOf(".");
  if (dotIdx < 0) return false;
  const payload = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!payload.startsWith(ADMIN_EMAIL + ":")) return false;
  const expected = createHmac("sha256", HMAC_KEY).update(payload).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export function generateAdminToken(): string {
  return signToken(ADMIN_EMAIL);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyToken(token);
}

export function validateAdminCredentials(email: string, password: string): boolean {
  if (!ADMIN_EMAIL || !ADMIN_SECRET) return false;
  return (
    email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
    password === ADMIN_SECRET
  );
}

export function getAdminCookieName(): string {
  return COOKIE_NAME;
}
