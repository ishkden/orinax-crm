import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMigrationKey, resolveOrgId, unauthorized, badRequest, internalError } from "@/lib/migration/auth";
import type { MigrationBatch, DealContactPayload } from "@/lib/migration/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!validateMigrationKey(request)) return unauthorized();

  let body: MigrationBatch<DealContactPayload>;
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
    const dealSourceIds = [...new Set(data.map((d) => d.dealSourceId))];
    const contactSourceIds = [...new Set(data.map((d) => d.contactSourceId))];

    const [deals, contacts] = await Promise.all([
      prisma.deal.findMany({
        where: { orgId: internalOrgId, sourceId: { in: dealSourceIds } },
        select: { id: true, sourceId: true },
      }),
      prisma.contact.findMany({
        where: { orgId: internalOrgId, sourceId: { in: contactSourceIds } },
        select: { id: true, sourceId: true },
      }),
    ]);

    const dealMap = new Map(deals.map((d) => [d.sourceId!, d.id]));
    const contactMap = new Map(contacts.map((c) => [c.sourceId!, c.id]));

    let upserted = 0;
    let skipped = 0;

    for (const item of data) {
      const dealId = dealMap.get(item.dealSourceId);
      const contactId = contactMap.get(item.contactSourceId);
      if (!dealId || !contactId) { skipped++; continue; }

      await prisma.dealContact.upsert({
        where: { dealId_contactId: { dealId, contactId } },
        create: {
          orgId: internalOrgId,
          dealId,
          contactId,
          isPrimary: item.isPrimary ?? false,
          isDeleted: item.isDeleted ?? false,
          syncedAt: new Date(),
        },
        update: {
          isPrimary: item.isPrimary ?? false,
          isDeleted: item.isDeleted ?? false,
          syncedAt: new Date(),
        },
      });
      upserted++;
    }

    return Response.json({ upserted, skipped });
  } catch (err) {
    console.error("[migration/deal-contacts]", err);
    return internalError("Failed to upsert deal-contacts");
  }
}
