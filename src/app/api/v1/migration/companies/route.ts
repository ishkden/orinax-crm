import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMigrationKey, unauthorized, badRequest, internalError } from "@/lib/migration/auth";
import type { MigrationBatch, CompanyPayload } from "@/lib/migration/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!validateMigrationKey(request)) return unauthorized();

  let body: MigrationBatch<CompanyPayload>;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { orgId, data } = body;
  if (!orgId) return badRequest("orgId is required");
  if (!Array.isArray(data) || data.length === 0) return badRequest("data must be a non-empty array");

  const invalid = data.find((c) => !c.sourceId || !c.name);
  if (invalid) return badRequest("Each company must have sourceId and name");

  try {
    const results = await prisma.$transaction(
      data.map((company) =>
        prisma.company.upsert({
          where: { orgId_sourceId: { orgId, sourceId: company.sourceId } },
          create: {
            orgId,
            sourceId: company.sourceId,
            name: company.name,
            industry: company.industry ?? null,
            phone: company.phone ?? null,
            email: company.email ?? null,
            website: company.website ?? null,
            address: company.address ?? null,
          },
          update: {
            name: company.name,
            industry: company.industry ?? null,
            phone: company.phone ?? null,
            email: company.email ?? null,
            website: company.website ?? null,
            address: company.address ?? null,
          },
          select: { id: true, sourceId: true },
        })
      )
    );

    return Response.json({ upserted: results.length, ids: results.map((r) => r.id) });
  } catch (err) {
    console.error("[migration/companies]", err);
    return internalError("Failed to upsert companies");
  }
}
