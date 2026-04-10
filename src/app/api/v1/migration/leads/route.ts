import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMigrationKey, resolveOrgId, unauthorized, badRequest, internalError } from "@/lib/migration/auth";
import type { MigrationBatch, LeadPayload } from "@/lib/migration/types";

export const dynamic = "force-dynamic";

function maybeDate(v?: string | null): Date | undefined {
  return v ? new Date(v) : undefined;
}

export async function POST(request: NextRequest) {
  if (!validateMigrationKey(request)) return unauthorized();

  let body: MigrationBatch<LeadPayload>;
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
    const contactSourceIds = [...new Set(data.map((l) => l.contactSourceId).filter(Boolean) as string[])];
    const companySourceIds = [...new Set(data.map((l) => l.companySourceId).filter(Boolean) as string[])];

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

    const results = await prisma.$transaction(
      data.map((lead) => {
        const contactId = lead.contactSourceId ? (contactMap.get(lead.contactSourceId) ?? null) : null;
        const companyId = lead.companySourceId ? (companyMap.get(lead.companySourceId) ?? null) : null;

        const shared = {
          title: lead.title ?? null,
          statusId: lead.statusId ?? null,
          statusSemantic: lead.statusSemantic ?? null,
          value: lead.value ?? 0,
          currency: lead.currency ?? "RUB",
          description: lead.description ?? null,
          tags: lead.tags ?? [],
          contactSourceId: lead.contactSourceId ?? null,
          companySourceId: lead.companySourceId ?? null,
          rawPayload: (lead.rawPayload as any) ?? undefined,
          assignedByExternalId: lead.assignedByExternalId ?? null,
          createdById: lead.createdById ?? null,
          modifyById: lead.modifyById ?? null,
          sourceDescription: lead.sourceDescription ?? null,
          dateCreate: maybeDate(lead.dateCreate),
          dateModify: maybeDate(lead.dateModify),
          isDeleted: lead.isDeleted ?? false,
          syncedAt: lead.syncedFromBitrixAt ? new Date(lead.syncedFromBitrixAt) : new Date(),
        };

        return prisma.lead.upsert({
          where: { orgId_sourceId: { orgId: internalOrgId, sourceId: lead.sourceId } },
          create: {
            orgId: internalOrgId,
            sourceId: lead.sourceId,
            contactId,
            companyId,
            ...shared,
            ...(lead.createdAt ? { createdAt: new Date(lead.createdAt) } : {}),
          },
          update: {
            ...shared,
            ...(contactId ? { contactId } : {}),
            ...(companyId ? { companyId } : {}),
          },
          select: { id: true, sourceId: true },
        });
      })
    );

    return Response.json({ upserted: results.length, ids: results.map((r) => r.id) });
  } catch (err) {
    console.error("[migration/leads]", err);
    return internalError("Failed to upsert leads");
  }
}
