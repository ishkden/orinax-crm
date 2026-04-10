import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMigrationKey, resolveOrgId, unauthorized, badRequest, internalError } from "@/lib/migration/auth";
import type { MigrationBatch, DealPayload } from "@/lib/migration/types";
import type { DealStage } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_STAGES: DealStage[] = [
  "LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST",
];

function resolveStage(raw?: string): DealStage {
  const upper = (raw ?? "").toUpperCase() as DealStage;
  return VALID_STAGES.includes(upper) ? upper : "LEAD";
}

function maybeDate(v?: string | null): Date | undefined {
  return v ? new Date(v) : undefined;
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

  const internalOrgId = await resolveOrgId(orgId);
  if (!internalOrgId) return badRequest("Org not found for externalId: " + orgId);
  if (!Array.isArray(data) || data.length === 0) return badRequest("data must be a non-empty array");

  try {
    const contactSourceIds = [...new Set(data.map((d) => d.contactSourceId).filter(Boolean) as string[])];
    const companySourceIds = [...new Set(data.map((d) => d.companySourceId).filter(Boolean) as string[])];
    const pipelineSourceIds = [...new Set(data.map((d) => d.pipelineSourceId).filter(Boolean) as string[])];
    const stageSourceIds = [...new Set(data.map((d) => d.stageSourceId).filter(Boolean) as string[])];

    const [contacts, companies, pipelines, stages] = await Promise.all([
      contactSourceIds.length > 0
        ? prisma.contact.findMany({ where: { orgId: internalOrgId, sourceId: { in: contactSourceIds } }, select: { id: true, sourceId: true } })
        : [],
      companySourceIds.length > 0
        ? prisma.company.findMany({ where: { orgId: internalOrgId, sourceId: { in: companySourceIds } }, select: { id: true, sourceId: true } })
        : [],
      pipelineSourceIds.length > 0
        ? prisma.pipeline.findMany({ where: { orgId: internalOrgId, sourceId: { in: pipelineSourceIds } }, select: { id: true, sourceId: true } })
        : [],
      stageSourceIds.length > 0
        ? prisma.stage.findMany({ where: { orgId: internalOrgId, sourceId: { in: stageSourceIds } }, select: { id: true, sourceId: true } })
        : [],
    ]);

    const contactMap = new Map(contacts.map((c) => [c.sourceId!, c.id]));
    const companyMap = new Map(companies.map((c) => [c.sourceId!, c.id]));
    const pipelineMap = new Map(pipelines.map((p) => [p.sourceId!, p.id]));
    const stageMap = new Map(stages.map((s) => [s.sourceId!, s.id]));

    let upserted = 0;
    const batchSize = 50;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await prisma.$transaction(
        batch.map((deal) => {
          const contactId = deal.contactSourceId ? (contactMap.get(deal.contactSourceId) ?? null) : null;
          const companyId = deal.companySourceId ? (companyMap.get(deal.companySourceId) ?? null) : null;
          const pipelineId = deal.pipelineSourceId ? (pipelineMap.get(deal.pipelineSourceId) ?? null) : null;
          const stageId = deal.stageSourceId ? (stageMap.get(deal.stageSourceId) ?? null) : null;
          const stage = resolveStage(deal.stage);

          const shared = {
            title: deal.title || `Сделка #${deal.sourceId}`,
            value: deal.value ?? 0,
            currency: deal.currency ?? "RUB",
            stage,
            description: deal.description ?? null,
            tags: deal.tags ?? [],
            rawPayload: (deal.rawPayload as any) ?? undefined,
            currencyId: deal.currencyId ?? null,
            assignedByExternalId: deal.assignedByExternalId ?? null,
            createdById: deal.createdById ?? null,
            modifyById: deal.modifyById ?? null,
            stageSemanticId: deal.stageSemanticId ?? null,
            sourceDescription: deal.sourceDescription ?? null,
            beginDate: maybeDate(deal.beginDate),
            closeDate: maybeDate(deal.closeDate),
            movedTime: maybeDate(deal.movedTime),
            lastActivityTime: maybeDate(deal.lastActivityTime),
            lastActivityBy: deal.lastActivityBy ?? null,
            dateCreate: maybeDate(deal.dateCreate),
            dateModify: maybeDate(deal.dateModify),
            isDeleted: deal.isDeleted ?? false,
            syncedAt: deal.syncedFromBitrixAt ? new Date(deal.syncedFromBitrixAt) : new Date(),
          };

          return prisma.deal.upsert({
            where: { orgId_sourceId: { orgId: internalOrgId, sourceId: deal.sourceId } },
            create: {
              orgId: internalOrgId,
              sourceId: deal.sourceId,
              contactId,
              companyId,
              pipelineId,
              stageId,
              ...shared,
            },
            update: {
              ...shared,
              ...(contactId ? { contactId } : {}),
              ...(companyId ? { companyId } : {}),
              ...(pipelineId ? { pipelineId } : {}),
              ...(stageId ? { stageId } : {}),
            },
            select: { id: true },
          });
        })
      );
      upserted += batch.length;
    }

    return Response.json({ upserted });
  } catch (err) {
    console.error("[migration/deals]", err);
    return internalError("Failed to upsert deals");
  }
}
