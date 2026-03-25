import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMigrationKey, resolveOrgId, unauthorized, badRequest, internalError } from "@/lib/migration/auth";
import type { MigrationBatch } from "@/lib/migration/types";

export const dynamic = "force-dynamic";

// Расширенный payload с учётом того, что Аналитика шлёт primaryPhone/primaryEmail/fullName
interface ContactPayloadExtended {
  sourceId: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  position?: string | null;
  notes?: string | null;
  tags?: string[];
  companySourceId?: string | null;
  createdAt?: string;
}

export async function POST(request: NextRequest) {
  if (!validateMigrationKey(request)) return unauthorized();

  let body: MigrationBatch<ContactPayloadExtended>;
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

  const invalid = data.find((c) => !c.sourceId);
  if (invalid) return badRequest("Each contact must have sourceId");

  try {
    // Resolve companySourceIds → internal Company.id in a single query
    const companySourceIds = [
      ...new Set(data.map((c) => c.companySourceId).filter(Boolean) as string[]),
    ];

    const companies =
      companySourceIds.length > 0
        ? await prisma.company.findMany({
            where: { orgId: internalOrgId, sourceId: { in: companySourceIds } },
            select: { id: true, sourceId: true },
          })
        : [];

    const companyMap = new Map(companies.map((c) => [c.sourceId!, c.id]));

    const results = await prisma.$transaction(
      data.map((contact) => {
        const companyId = contact.companySourceId
          ? (companyMap.get(contact.companySourceId) ?? null)
          : null;

        // Поддержка как firstName/lastName, так и fullName из Аналитики
        const firstName = contact.firstName || (contact.fullName ? contact.fullName.split(" ")[0] : "") || "—";
        const lastName = contact.lastName || (contact.fullName ? contact.fullName.split(" ").slice(1).join(" ") : "") || "";

        // Поддержка как email/phone, так и primaryEmail/primaryPhone из Аналитики
        const email = contact.email ?? contact.primaryEmail ?? null;
        const phone = contact.phone ?? contact.primaryPhone ?? null;

        return prisma.contact.upsert({
          where: { orgId_sourceId: { orgId: internalOrgId, sourceId: contact.sourceId } },
          create: {
            orgId: internalOrgId,
            sourceId: contact.sourceId,
            firstName,
            lastName,
            email,
            phone,
            position: contact.position ?? null,
            notes: contact.notes ?? null,
            tags: contact.tags ?? [],
            source: "ORINAX_ANALYTICS",
            companyId,
            ...(contact.createdAt ? { createdAt: new Date(contact.createdAt) } : {}),
          },
          update: {
            firstName,
            lastName,
            email,
            phone,
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
