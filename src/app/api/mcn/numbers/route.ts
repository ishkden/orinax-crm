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

function headers() {
  return { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SECRET };
}

/** GET /api/mcn/numbers?regionCode=495&beautiLevel=0&purchased=true */
export async function GET(req: NextRequest) {
  const externalOrgId = await getExternalOrgId();
  if (!externalOrgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const params = new URLSearchParams({ orgId: externalOrgId });
  if (searchParams.get("regionCode")) params.set("regionCode", searchParams.get("regionCode")!);
  if (searchParams.get("beautiLevel")) params.set("beautiLevel", searchParams.get("beautiLevel")!);
  if (searchParams.get("ndcType")) params.set("ndcType", searchParams.get("ndcType")!);
  if (searchParams.get("purchased")) params.set("purchased", searchParams.get("purchased")!);

  const res = await fetch(`${CRM_APP_BASE}/api/internal/mcn/numbers?${params}`, {
    method: "GET",
    headers: headers(),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

/** POST /api/mcn/numbers — купить номер */
export async function POST(req: NextRequest) {
  const externalOrgId = await getExternalOrgId();
  if (!externalOrgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const res = await fetch(`${CRM_APP_BASE}/api/internal/mcn/numbers`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ ...body, orgId: externalOrgId }),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
