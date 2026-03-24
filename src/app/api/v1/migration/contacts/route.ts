import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMigrationKey, unauthorized, badRequest, internalError } from "@/lib/migration/auth";
import type { MigrationBatch, ContactPayload } from "@/lib/migration/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!validateMigrationKey(request)) return unauthorized();

  let body: MigrationBatch<ContactPayload>;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { orgId, data } = body;
  if (!orgId) return badRequest("orgId is required");
  if (!Array.isArray(data) || data.length === 0) return badRequest("data must be a non-empty array");

  const invalid = data.find((c) => !c.sourceId || !c.firstName || !c.lastName);
  if (invalid) return badRequest("Each contact must have sourceId, firstName, and lastName");

  try {
    // Resolve companySourceIds → internal Company.id in a single query
    const companySourceIds = [
      ...new Set(data.map((c) => c.companySourceId).filter(Boolean) as string[]),
    ];

    const companies =
      companySourceIds.length > 0
        ? await prisma.company.findMany({
            where: { orgId, sourceId: { in: companySourceIds } },
            select: { id: true, sourceId: true },
          })
        : [];

    const companyMap = new Map(companies.map((c) => [c.sourceId!, c.id]));

    const results = await prisma.$transaction(
      data.map((contact) => {
        const companyId = contact.companySourceId
          ? (companyMap.get(contact.companySourceId) ?? null)
          : null;

        return prisma.contact.upsert({
          where: { orgId_sourceId: { orgId, sourceId: contact.sourceId } },
          create: {
            orgId,
            sourceId: contact.sourceId,
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email ?? null,
            phone: contact.phone ?? null,
            position: contact.position ?? null,
            notes: contact.notes ?? null,
            tags: contact.tags ?? [],
            source: "ORINAX_ANALYTICS",
            companyId,
            ...(contact.createdAt ? { createdAt: new Date(contact.createdAt) } : {}),
          },
          update: {
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email ?? null,
            phone: contact.phone ?? null,
            position: contact.position ?? null,
            notes: contact.notes ?? null,
            tags: contact.tags ?? [],
            ...(companyId ? { companyId } : {}),
          },
          select: { id: true, sourceId: true },
        });
      })
    );

    return Response.json({ upserted: results.length, ids: results.map((r) => r.id) });
  } catch (err) {
    console.error("[migration/contacts]", err);
    return internalError("Failed to upsert contacts");
  }
}
