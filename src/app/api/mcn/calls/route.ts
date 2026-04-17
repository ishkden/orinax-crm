import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CRM_APP_BASE =
  process.env.ORINAX_ANALYTICS_INTERNAL_URL ??
  process.env.CRM_APP_INTERNAL_URL ??
  "http://127.0.0.1:3000";
const INTERNAL_SECRET = process.env.CONNECTOR_API_SECRET ?? "";

async function getExternalOrgId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const localOrgId = (session.user as { orgId?: string | null }).orgId;
  if (!localOrgId) return null;
  const org = await prisma.org.findUnique({ where: { id: localOrgId }, select: { externalId: true } });
  return org?.externalId ?? null;
}

export async function GET(req: NextRequest) {
  const externalOrgId = await getExternalOrgId();
  if (!externalOrgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const params = new URLSearchParams({ orgId: externalOrgId });
  if (searchParams.get("page")) params.set("page", searchParams.get("page")!);
  if (searchParams.get("limit")) params.set("limit", searchParams.get("limit")!);

  try {
    const res = await fetch(`${CRM_APP_BASE}/api/internal/mcn/calls?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SECRET },
    });
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
    return NextResponse.json({ calls: [] });
  } catch {
    return NextResponse.json({ calls: [] });
  }
}
