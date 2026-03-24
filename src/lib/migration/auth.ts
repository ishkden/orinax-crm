import type { NextRequest } from "next/server";

export function validateMigrationKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-migration-api-key");
  const expectedKey = process.env.MIGRATION_API_KEY;
  if (!expectedKey) return false;
  return apiKey === expectedKey;
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
