import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMigrationKey, resolveOrgId, unauthorized, badRequest, internalError } from "@/lib/migration/auth";
import type { MigrationBatch, MessagePayload } from "@/lib/migration/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!validateMigrationKey(request)) return unauthorized();

  let body: MigrationBatch<MessagePayload>;
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

  const invalid = data.find((m) => !m.sourceId || (!m.dealSourceId && !m.contactSourceId));
  if (invalid) return badRequest("Each message must have sourceId and either dealSourceId or contactSourceId");

  try {
    // ── Pre-fetch all needed deals and contacts in two queries ──────────────────

    const dealSourceIds = [
      ...new Set(data.map((m) => m.dealSourceId).filter(Boolean) as string[]),
    ];
    const contactSourceIds = [
      ...new Set(data.map((m) => m.contactSourceId).filter(Boolean) as string[]),
    ];

    const [deals, contacts] = await Promise.all([
      dealSourceIds.length > 0
        ? prisma.deal.findMany({
            where: { orgId, sourceId: { in: dealSourceIds } },
            select: { id: true, sourceId: true, contactId: true },
          })
        : Promise.resolve([]),
      contactSourceIds.length > 0
        ? prisma.contact.findMany({
            where: { orgId, sourceId: { in: contactSourceIds } },
            select: { id: true, sourceId: true },
          })
        : Promise.resolve([]),
    ]);

    const dealMap = new Map(deals.map((d) => [d.sourceId!, { id: d.id, contactId: d.contactId }]));
    const contactMap = new Map(contacts.map((c) => [c.sourceId!, c.id]));

    // ── Interactive transaction: find-or-create Conversation, then upsert Messages ─

    const upserted = await prisma.$transaction(
      async (tx) => {
        /** Cache conversationId per contactId to avoid redundant DB round-trips */
        const conversationCache = new Map<string, string>();
        const results: Array<{ id: string; sourceId: string | null }> = [];

        for (const msg of data) {
          // Resolve contactId
          let contactId: string | null = null;
          let dealId: string | null = null;

          if (msg.dealSourceId) {
            const deal = dealMap.get(msg.dealSourceId);
            if (deal) {
              dealId = deal.id;
              contactId = deal.contactId ?? null;
            }
          } else if (msg.contactSourceId) {
            contactId = contactMap.get(msg.contactSourceId) ?? null;
          }

          if (!contactId) {
            // Skip messages whose parent entity was not found; log for traceability
            console.warn(
              `[migration/messages] skipping sourceId=${msg.sourceId}: could not resolve contactId`
            );
            continue;
          }

          // Find or create the migration Conversation for this contact
          let conversationId = conversationCache.get(contactId);

          if (!conversationId) {
            const externalId = `bitrix24_migration_${contactId}`;

            const existing = await tx.conversation.findFirst({
              where: { orgId, contactId, externalId },
              select: { id: true },
            });

            if (existing) {
              conversationId = existing.id;
            } else {
              const created = await tx.conversation.create({
                data: {
                  orgId: internalOrgId,
                  contactId,
                  channel: "OTHER",
                  externalId,
                  status: "CLOSED",
                },
                select: { id: true },
              });
              conversationId = created.id;
            }

            conversationCache.set(contactId, conversationId);
          }

          // Upsert the message
          const message = await tx.message.upsert({
            where: {
              conversationId_sourceId: {
                conversationId,
                sourceId: msg.sourceId,
              },
            },
            create: {
              conversationId,
              sourceId: msg.sourceId,
              body: msg.body,
              fromExternal: msg.fromExternal ?? true,
              metadata: {
                ...(msg.metadata ?? {}),
                ...(dealId ? { dealId } : {}),
              },
              ...(msg.createdAt ? { createdAt: new Date(msg.createdAt) } : {}),
            },
            update: {
              body: msg.body,
              fromExternal: msg.fromExternal ?? true,
              metadata: {
                ...(msg.metadata ?? {}),
                ...(dealId ? { dealId } : {}),
              },
            },
            select: { id: true, sourceId: true },
          });

          results.push(message);
        }

        return results;
      },
      { timeout: 60_000 } // generous timeout for large migration batches
    );

    return Response.json({ upserted: upserted.length, ids: upserted.map((m) => m.id) });
  } catch (err) {
    console.error("[migration/messages]", err);
    return internalError("Failed to upsert messages");
  }
}
