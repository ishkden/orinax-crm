import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export function validateMigrationKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-migration-api-key");
  const expectedKey = process.env.MIGRATION_API_KEY;
  if (!expectedKey) return false;
  return apiKey === expectedKey;
}

/**
 * Резолвит externalId организации (из Аналитики) в внутренний CRM org.id.
 * Возвращает null если орг не найдена.
 */
export async function resolveOrgId(externalOrgId: string): Promise<string | null> {
  const org = await prisma.org.findUnique({
    where: { externalId: externalOrgId },
    select: { id: true },
  });
  return org?.id ?? null;
}

export function unauthorized() {
  return Response.json(
    { error: "Unauthorized: missing or invalid X-Migration-API-Key header" },
    { status: 401 }
  );
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function internalError(message: string) {
  return Response.json({ error: message }, { status: 500 });
}
