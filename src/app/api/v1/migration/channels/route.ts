import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMigrationKey, resolveOrgId, unauthorized, badRequest, internalError } from "@/lib/migration/auth";
import type { MigrationBatch, ChannelPayload } from "@/lib/migration/types";
import type { ChannelKind } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_KINDS: ChannelKind[] = ["PHONE", "EMAIL", "IM"];

export async function POST(request: NextRequest) {
  if (!validateMigrationKey(request)) return unauthorized();

  let body: MigrationBatch<ChannelPayload>;
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
    const contactSourceIds = [...new Set(data.map((c) => c.contactSourceId).filter(Boolean) as string[])];
    const companySourceIds = [...new Set(data.map((c) => c.companySourceId).filter(Boolean) as string[])];

    const [contacts, companies] = await Promise.all([
      contactSourceIds.length > 0
        ? prisma.contact.findMany({ where: { orgId: internalOrgId, sourceId: { in: contactSourceIds } }, select: { id: true, sourceId: true } })
        : [],
      companySourceIds.length > 0
        ? prisma.company.findMany({ where: { orgId: internalOrgId, sourceId: { in: companySourceIds } }, select: { id: true, sourceId: true } })
        : [],
    ]);

    const contactMap = new Map(contacts.map((c) => [c.sourceId!, c.id]));
    const companyMap = new Map(companies.map((c) => [c.sourceId!, c.id]));

    let upserted = 0;
    let skipped = 0;

    for (const item of data) {
      const contactId = item.contactSourceId ? (contactMap.get(item.contactSourceId) ?? null) : null;
      const companyId = item.companySourceId ? (companyMap.get(item.companySourceId) ?? null) : null;
      if (!contactId && !companyId) { skipped++; continue; }

      const kind = VALID_KINDS.includes(item.type as ChannelKind) ? (item.type as ChannelKind) : "PHONE";

      if (item.sourceId) {
        const existing = await prisma.communicationChannel.findFirst({
          where: { orgId: internalOrgId, sourceId: item.sourceId },
        });

        if (existing) {
          await prisma.communicationChannel.update({
            where: { id: existing.id },
            data: {
              type: kind,
              value: item.value,
              isPrimary: item.isPrimary ?? false,
              messengerType: item.messengerType ?? null,
              isDeleted: item.isDeleted ?? false,
              syncedAt: new Date(),
            },
          });
          upserted++;
          continue;
        }
      }

      await prisma.communicationChannel.create({
        data: {
          orgId: internalOrgId,
          sourceId: item.sourceId ?? null,
          contactId,
          companyId,
          type: kind,
          value: item.value,
          isPrimary: item.isPrimary ?? false,
          messengerType: item.messengerType ?? null,
          isDeleted: item.isDeleted ?? false,
          syncedAt: new Date(),
        },
      });
      upserted++;
    }

    return Response.json({ upserted, skipped });
  } catch (err) {
    console.error("[migration/channels]", err);
    return internalError("Failed to upsert channels");
  }
}
