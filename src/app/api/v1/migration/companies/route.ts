import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMigrationKey, resolveOrgId, unauthorized, badRequest, internalError } from "@/lib/migration/auth";
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

  const internalOrgId = await resolveOrgId(orgId);
  if (!internalOrgId) return badRequest("Org not found for externalId: " + orgId);
  if (!Array.isArray(data) || data.length === 0) return badRequest("data must be a non-empty array");

  try {
    const results = await prisma.$transaction(
      data.map((company) =>
        prisma.company.upsert({
          where: { orgId_sourceId: { orgId: internalOrgId, sourceId: company.sourceId } },
          create: {
            orgId: internalOrgId,
            sourceId: company.sourceId,
            name: company.name,
            industry: company.industry ?? null,
            phone: company.phone ?? null,
            email: company.email ?? null,
            website: company.website ?? null,
            address: company.address ?? null,
            inn: company.inn ?? null,
            customFields: (company.customFields as any) ?? undefined,
            isDeleted: company.isDeleted ?? false,
            syncedAt: company.syncedFromBitrixAt ? new Date(company.syncedFromBitrixAt) : new Date(),
          },
          update: {
            name: company.name,
            industry: company.industry ?? undefined,
            phone: company.phone ?? undefined,
            email: company.email ?? undefined,
            website: company.website ?? undefined,
            address: company.address ?? undefined,
            inn: company.inn ?? undefined,
            customFields: (company.customFields as any) ?? undefined,
            isDeleted: company.isDeleted ?? false,
            syncedAt: company.syncedFromBitrixAt ? new Date(company.syncedFromBitrixAt) : new Date(),
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
