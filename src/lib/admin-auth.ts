import { cookies } from "next/headers";
import { createHmac } from "crypto";

const ADMIN_PASSWORD = "3133812";
const COOKIE_NAME = "orinax_admin_token";
const SECRET = process.env.NEXTAUTH_SECRET || "fallback-admin-secret";

export function generateAdminToken(): string {
  return createHmac("sha256", SECRET).update(ADMIN_PASSWORD).digest("hex");
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return token === generateAdminToken();
}

export function getAdminCookieName(): string {
  return COOKIE_NAME;
}
