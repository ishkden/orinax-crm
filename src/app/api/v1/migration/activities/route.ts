import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMigrationKey, resolveOrgId, unauthorized, badRequest, internalError } from "@/lib/migration/auth";
import type { MigrationBatch, ActivityPayload } from "@/lib/migration/types";
import type { ActivityType } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_TYPES: ActivityType[] = [
  "NOTE", "CALL", "EMAIL", "MEETING", "SMS", "TASK_BITRIX",
  "DEAL_CREATED", "DEAL_STAGE_CHANGED", "CONTACT_CREATED",
  "TASK_CREATED", "TASK_COMPLETED",
];

function resolveType(raw: string): ActivityType {
  const upper = raw.toUpperCase() as ActivityType;
  return VALID_TYPES.includes(upper) ? upper : "NOTE";
}

export async function POST(request: NextRequest) {
  if (!validateMigrationKey(request)) return unauthorized();

  let body: MigrationBatch<ActivityPayload>;
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
    const dealSourceIds = [...new Set(data.map((a) => a.dealSourceId).filter(Boolean) as string[])];
    const contactSourceIds = [...new Set(data.map((a) => a.contactSourceId).filter(Boolean) as string[])];

    const [deals, contacts] = await Promise.all([
      dealSourceIds.length > 0
        ? prisma.deal.findMany({ where: { orgId: internalOrgId, sourceId: { in: dealSourceIds } }, select: { id: true, sourceId: true } })
        : [],
      contactSourceIds.length > 0
        ? prisma.contact.findMany({ where: { orgId: internalOrgId, sourceId: { in: contactSourceIds } }, select: { id: true, sourceId: true } })
        : [],
    ]);

    const dealMap = new Map(deals.map((d) => [d.sourceId!, d.id]));
    const contactMap = new Map(contacts.map((c) => [c.sourceId!, c.id]));

    let upserted = 0;

    for (const item of data) {
      const dealId = item.dealSourceId ? (dealMap.get(item.dealSourceId) ?? null) : null;
      const contactId = item.contactSourceId ? (contactMap.get(item.contactSourceId) ?? null) : null;

      const existing = item.sourceId
        ? await prisma.activity.findFirst({
            where: { orgId: internalOrgId, sourceId: item.sourceId },
          })
        : null;

      if (existing) {
        await prisma.activity.update({
          where: { id: existing.id },
          data: {
            type: resolveType(item.type),
            title: item.title,
            body: item.body ?? null,
            direction: item.direction ?? null,
            duration: item.duration ?? null,
            recordingUrl: item.recordingUrl ?? null,
            metadata: (item.metadata as any) ?? undefined,
            ...(dealId ? { dealId } : {}),
            ...(contactId ? { contactId } : {}),
          },
        });
      } else {
        await prisma.activity.create({
          data: {
            orgId: internalOrgId,
            sourceId: item.sourceId,
            type: resolveType(item.type),
            title: item.title,
            body: item.body ?? null,
            dealId,
            contactId,
            direction: item.direction ?? null,
            duration: item.duration ?? null,
            recordingUrl: item.recordingUrl ?? null,
            metadata: (item.metadata as any) ?? undefined,
            ...(item.createdAt ? { createdAt: new Date(item.createdAt) } : {}),
          },
        });
      }
      upserted++;
    }

    return Response.json({ upserted });
  } catch (err) {
    console.error("[migration/activities]", err);
    return internalError("Failed to upsert activities");
  }
}
