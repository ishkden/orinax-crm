import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMigrationKey, resolveOrgId, unauthorized, badRequest, internalError } from "@/lib/migration/auth";
import type { MigrationBatch, CommentPayload } from "@/lib/migration/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!validateMigrationKey(request)) return unauthorized();

  let body: MigrationBatch<CommentPayload>;
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
    const dealSourceIds = [...new Set(data.map((c) => c.dealSourceId).filter(Boolean) as string[])];
    const contactSourceIds = [...new Set(data.map((c) => c.contactSourceId).filter(Boolean) as string[])];

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
        ? await prisma.comment.findFirst({
            where: { orgId: internalOrgId, sourceId: item.sourceId },
          })
        : null;

      if (existing) {
        await prisma.comment.update({
          where: { id: existing.id },
          data: { body: item.body },
        });
      } else {
        await prisma.comment.create({
          data: {
            orgId: internalOrgId,
            sourceId: item.sourceId,
            body: item.body,
            dealId,
            contactId,
            ...(item.createdAt ? { createdAt: new Date(item.createdAt) } : {}),
          },
        });
      }
      upserted++;
    }

    return Response.json({ upserted });
  } catch (err) {
    console.error("[migration/comments]", err);
    return internalError("Failed to upsert comments");
  }
}
