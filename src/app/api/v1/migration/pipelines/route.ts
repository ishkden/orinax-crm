import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMigrationKey, resolveOrgId, unauthorized, badRequest, internalError } from "@/lib/migration/auth";
import type { MigrationBatch, PipelinePayload } from "@/lib/migration/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!validateMigrationKey(request)) return unauthorized();

  let body: MigrationBatch<PipelinePayload>;
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

  const invalid = data.find((p) => !p.sourceId || !p.name);
  if (invalid) return badRequest("Each pipeline must have sourceId and name");

  try {
    const results = await prisma.$transaction(
      data.map((pipeline) =>
        prisma.pipeline.upsert({
          where: { orgId_sourceId: { orgId: internalOrgId, sourceId: pipeline.sourceId } },
          create: {
            orgId: internalOrgId,
            sourceId: pipeline.sourceId,
            name: pipeline.name,
            sortOrder: pipeline.sortOrder ?? 0,
          },
          update: {
            name: pipeline.name,
            sortOrder: pipeline.sortOrder ?? 0,
          },
          select: { id: true, sourceId: true },
        })
      )
    );

    return Response.json({ upserted: results.length, ids: results.map((r) => r.id) });
  } catch (err) {
    console.error("[migration/pipelines]", err);
    return internalError("Failed to upsert pipelines");
  }
}
