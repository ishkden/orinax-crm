import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// crm-app (аналитика) слушает на порту 3000
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

  const org = await prisma.org.findUnique({
    where: { id: localOrgId },
    select: { externalId: true },
  });

  return org?.externalId ?? null;
}

function internalHeaders() {
  return {
    "Content-Type": "application/json",
    "x-internal-secret": INTERNAL_SECRET,
  };
}

/** GET /api/mcn — загрузить текущие настройки MCN */
export async function GET() {
  const externalOrgId = await getExternalOrgId();
  if (!externalOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(`${CRM_APP_BASE}/api/internal/mcn?orgId=${externalOrgId}`, {
    method: "GET",
    headers: internalHeaders(),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

/** POST /api/mcn — сохранить настройки MCN */
export async function POST(req: NextRequest) {
  const externalOrgId = await getExternalOrgId();
  if (!externalOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { mcnAccountId?: unknown; mcnToken?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Невалидный JSON." }, { status: 400 });
  }

  const res = await fetch(`${CRM_APP_BASE}/api/internal/mcn`, {
    method: "POST",
    headers: internalHeaders(),
    body: JSON.stringify({
      orgId: externalOrgId,
      mcnAccountId: body.mcnAccountId,
      mcnToken: body.mcnToken,
    }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

/** DELETE /api/mcn — отключить MCN */
export async function DELETE() {
  const externalOrgId = await getExternalOrgId();
  if (!externalOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(`${CRM_APP_BASE}/api/internal/mcn?orgId=${externalOrgId}`, {
    method: "DELETE",
    headers: internalHeaders(),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
