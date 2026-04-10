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

  try {
    const pipelineSourceIds = [...new Set(data.map((s) => s.pipelineSourceId))];
    const pipelines = await prisma.pipeline.findMany({
      where: { orgId: internalOrgId, sourceId: { in: pipelineSourceIds } },
      select: { id: true, sourceId: true },
    });
    const pipelineMap = new Map(pipelines.map((p) => [p.sourceId!, p.id]));

    let upserted = 0;
    let skipped = 0;

    for (const stage of data) {
      const pipelineId = pipelineMap.get(stage.pipelineSourceId);
      if (!pipelineId) { skipped++; continue; }

      const isFinal = stage.semantics === "F" || stage.semantics === "S" || stage.isFinal === true;
      const isWon = stage.semantics === "S" || stage.isWon === true;

      await prisma.stage.upsert({
        where: { orgId_sourceId: { orgId: internalOrgId, sourceId: stage.sourceId } },
        create: {
          orgId: internalOrgId,
          pipelineId,
          sourceId: stage.sourceId,
          name: stage.name,
          color: stage.color ?? (isWon ? "#22c55e" : isFinal ? "#ef4444" : "#6366f1"),
          sortOrder: stage.sortOrder ?? 0,
          isFinal,
          isWon,
          semantics: stage.semantics ?? null,
        },
        update: {
          pipelineId,
          name: stage.name,
          color: stage.color ?? (isWon ? "#22c55e" : isFinal ? "#ef4444" : undefined),
          sortOrder: stage.sortOrder ?? 0,
          isFinal,
          isWon,
          semantics: stage.semantics ?? null,
        },
      });
      upserted++;
    }

    return Response.json({ upserted, skipped });
  } catch (err) {
    console.error("[migration/stages]", err);
    return internalError("Failed to upsert stages");
  }
}
