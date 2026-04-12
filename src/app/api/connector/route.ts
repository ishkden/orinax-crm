import { NextRequest, NextResponse } from "next/server";
import { getToken, JWT } from "next-auth/jwt";

const CONNECTOR_BASE =
  process.env.CONNECTOR_BASE_URL || "http://176.124.214.127:3002";
const API_SECRET =
  process.env.CONNECTOR_API_SECRET ||
  "ornix-internal-8ac19ca78f7d307ba4cc2448ad407fef";

async function getSessionToken(request: NextRequest): Promise<JWT | null> {
  return getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
}

function sanitizePath(raw: string): string | null {
  if (!raw.startsWith("/")) return null;
  if (raw.includes("://") || raw.includes("\\")) return null;
  return raw;
}

export async function GET(request: NextRequest) {
  const token = await getSessionToken(request);
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const rawPath = searchParams.get("path") || "/connectors";
  const path = sanitizePath(rawPath);
  if (!path)
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });

  const orgId = token.orgId as string | undefined;
  const separator = path.includes("?") ? "&" : "?";
  const upstreamPath = orgId
    ? `${path}${separator}orgId=${encodeURIComponent(orgId)}`
    : path;

  try {
    const res = await fetch(`${CONNECTOR_BASE}${upstreamPath}`, {
      headers: { "X-API-Secret": API_SECRET },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Connection to connector failed", detail: String(err) },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  const token = await getSessionToken(request);
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const rawPath = searchParams.get("path") || "/connectors";
  const path = sanitizePath(rawPath);
  if (!path)
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });

  const orgId = token.orgId as string | undefined;

  try {
    const contentType = request.headers.get("content-type") || "";
    let upstreamRes: Response;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      upstreamRes = await fetch(`${CONNECTOR_BASE}${path}`, {
        method: "POST",
        headers: { "X-API-Secret": API_SECRET },
        body: formData,
      });
    } else {
      let bodyObj: Record<string, unknown> = {};
      try {
        bodyObj = await request.json();
      } catch {
        /* empty body */
      }
      if (orgId && !bodyObj.orgId) bodyObj.orgId = orgId;

      upstreamRes = await fetch(`${CONNECTOR_BASE}${path}`, {
        method: "POST",
        headers: {
          "X-API-Secret": API_SECRET,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyObj),
      });
    }

    const data = await upstreamRes.json();
    return NextResponse.json(data, { status: upstreamRes.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Connection to connector failed", detail: String(err) },
      { status: 502 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const token = await getSessionToken(request);
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const rawPath = searchParams.get("path") || "/";
  const path = sanitizePath(rawPath);
  if (!path)
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });

  try {
    const res = await fetch(`${CONNECTOR_BASE}${path}`, {
      method: "DELETE",
      headers: { "X-API-Secret": API_SECRET },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Connection to connector failed", detail: String(err) },
      { status: 502 },
    );
  }
}
