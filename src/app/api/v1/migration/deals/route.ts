import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMigrationKey, unauthorized, badRequest, internalError } from "@/lib/migration/auth";
import type { MigrationBatch, DealPayload } from "@/lib/migration/types";
import type { DealStage } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_STAGES: DealStage[] = [
  "LEAD",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
];

function resolveStage(raw?: string): DealStage {
  const upper = (raw ?? "").toUpperCase() as DealStage;
  return VALID_STAGES.includes(upper) ? upper : "LEAD";
}

export async function POST(request: NextRequest) {
  if (!validateMigrationKey(request)) return unauthorized();

  let body: MigrationBatch<DealPayload>;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { orgId, data } = body;
  if (!orgId) return badRequest("orgId is required");
  if (!Array.isArray(data) || data.length === 0) return badRequest("data must be a non-empty array");

  const invalid = data.find((d) => !d.sourceId || !d.title);
  if (invalid) return badRequest("Each deal must have sourceId and title");

  try {
    // Resolve contactSourceIds → internal Contact.id
    const contactSourceIds = [
      ...new Set(data.map((d) => d.contactSourceId).filter(Boolean) as string[]),
    ];

    const contacts =
      contactSourceIds.length > 0
        ? await prisma.contact.findMany({
            where: { orgId, sourceId: { in: contactSourceIds } },
            select: { id: true, sourceId: true },
          })
        : [];

    const contactMap = new Map(contacts.map((c) => [c.sourceId!, c.id]));

    // Resolve pipelineSourceIds → internal Pipeline.id
    const pipelineSourceIds = [
      ...new Set(data.map((d) => d.pipelineSourceId).filter(Boolean) as string[]),
    ];

    const pipelines =
      pipelineSourceIds.length > 0
        ? await prisma.pipeline.findMany({
            where: { orgId, sourceId: { in: pipelineSourceIds } },
            select: { id: true, sourceId: true },
          })
        : [];

    const pipelineMap = new Map(pipelines.map((p) => [p.sourceId!, p.id]));

    // Resolve stageSourceIds → internal Stage.id
    const stageSourceIds = [
      ...new Set(data.map((d) => d.stageSourceId).filter(Boolean) as string[]),
    ];

    const stages =
      stageSourceIds.length > 0
        ? await prisma.stage.findMany({
            where: { orgId, sourceId: { in: stageSourceIds } },
            select: { id: true, sourceId: true },
          })
        : [];

    const stageMap = new Map(stages.map((s) => [s.sourceId!, s.id]));

    const results = await prisma.$transaction(
      data.map((deal) => {
        const contactId = deal.contactSourceId
          ? (contactMap.get(deal.contactSourceId) ?? null)
          : null;
        const pipelineId = deal.pipelineSourceId
          ? (pipelineMap.get(deal.pipelineSourceId) ?? null)
          : null;
        const stageId = deal.stageSourceId
          ? (stageMap.get(deal.stageSourceId) ?? null)
          : null;
        const stage = resolveStage(deal.stage);

        return prisma.deal.upsert({
          where: { orgId_sourceId: { orgId, sourceId: deal.sourceId } },
          create: {
            orgId,
            sourceId: deal.sourceId,
            title: deal.title,
            value: deal.value ?? 0,
            currency: deal.currency ?? "RUB",
            stage,
            description: deal.description ?? null,
            tags: deal.tags ?? [],
            contactId,
            pipelineId,
            stageId,
            ...(deal.closeDate ? { closeDate: new Date(deal.closeDate) } : {}),
          },
          update: {
            title: deal.title,
            value: deal.value ?? 0,
            currency: deal.currency ?? "RUB",
            stage,
            description: deal.description ?? null,
            tags: deal.tags ?? [],
            ...(contactId ? { contactId } : {}),
            ...(pipelineId ? { pipelineId } : {}),
            ...(stageId ? { stageId } : {}),
            ...(deal.closeDate ? { closeDate: new Date(deal.closeDate) } : {}),
          },
          select: { id: true, sourceId: true },
        });
      })
    );

    return Response.json({ upserted: results.length, ids: results.map((r) => r.id) });
  } catch (err) {
    console.error("[migration/deals]", err);
    return internalError("Failed to upsert deals");
  }
}
