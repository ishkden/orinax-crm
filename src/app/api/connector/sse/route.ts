import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const CONNECTOR_BASE =
  process.env.CONNECTOR_BASE_URL || "http://176.124.214.127:3002";
const API_SECRET =
  process.env.CONNECTOR_API_SECRET ||
  "ornix-internal-8ac19ca78f7d307ba4cc2448ad407fef";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawPath = searchParams.get("path") || "/logs/stream";
  if (
    !rawPath.startsWith("/") ||
    rawPath.includes("://") ||
    rawPath.includes("\\")
  ) {
    return new Response("Invalid path", { status: 400 });
  }

  const upstreamUrl = `${CONNECTOR_BASE}${rawPath}${rawPath.includes("?") ? "&" : "?"}secret=${encodeURIComponent(API_SECRET)}`;

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      cache: "no-store",
      signal: request.signal,
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      return new Response("Upstream error", { status: 502 });
    }

    return new Response(upstreamRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return new Response("Connection failed", { status: 502 });
  }
}
