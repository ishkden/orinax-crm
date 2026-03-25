import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMigrationKey, resolveOrgId, unauthorized, badRequest, internalError } from "@/lib/migration/auth";
import type { MigrationBatch, StagePayload } from "@/lib/migration/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!validateMigrationKey(request)) return unauthorized();

  let body: MigrationBatch<StagePayload>;
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

  const invalid = data.find((s) => !s.sourceId || !s.name || !s.pipelineSourceId);
  if (invalid) return badRequest("Each stage must have sourceId, name and pipelineSourceId");

  try {
    // Resolve all referenced pipelineSourceIds → internal Pipeline.id in one query
    const pipelineSourceIds = [...new Set(data.map((s) => s.pipelineSourceId))];

    const pipelines = await prisma.pipeline.findMany({
      where: { orgId: internalOrgId, sourceId: { in: pipelineSourceIds } },
      select: { id: true, sourceId: true },
    });

    const pipelineMap = new Map(pipelines.map((p) => [p.sourceId!, p.id]));

    const missing = pipelineSourceIds.find((sid) => !pipelineMap.has(sid));
    if (missing) {
      return badRequest(`Pipeline with sourceId "${missing}" not found for this org. Import pipelines first.`);
    }

    const results = await prisma.$transaction(
      data.map((stage) => {
        const pipelineId = pipelineMap.get(stage.pipelineSourceId)!;

        return prisma.stage.upsert({
          where: { orgId_sourceId: { orgId: internalOrgId, sourceId: stage.sourceId } },
          create: {
            orgId: internalOrgId,
            pipelineId,
            sourceId: stage.sourceId,
            name: stage.name,
            color: stage.color ?? null,
            sortOrder: stage.sortOrder ?? 0,
            isFinal: stage.isFinal ?? false,
            isWon: stage.isWon ?? false,
          },
          update: {
            pipelineId,
            name: stage.name,
            color: stage.color ?? null,
            sortOrder: stage.sortOrder ?? 0,
            isFinal: stage.isFinal ?? false,
            isWon: stage.isWon ?? false,
          },
          select: { id: true, sourceId: true },
        });
      })
    );

    return Response.json({ upserted: results.length, ids: results.map((r) => r.id) });
  } catch (err) {
    console.error("[migration/stages]", err);
    return internalError("Failed to upsert stages");
  }
}
