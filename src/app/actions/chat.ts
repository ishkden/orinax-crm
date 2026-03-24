"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getSessionContext(): Promise<{ userId: string; orgId: string }> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) throw new Error("Unauthorized");

  const member = await prisma.orgMember.findFirst({
    where: { userId },
    select: { orgId: true },
  });
  if (!member) throw new Error("No org found for this user");
  return { userId, orgId: member.orgId };
}

// ─── Public types ─────────────────────────────────────────────────────────────

export type ChatMessage = {
  id: string;
  body: string | null;
  /** true = INBOUND (from client), false = OUTBOUND (from agent) */
  fromExternal: boolean;
  createdAt: string;
  authorName: string | null;
};

export type ConversationData = {
  conversationId: string | null;
  messages: ChatMessage[];
};

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function getDealConversation(
  dealId: string
): Promise<ConversationData> {
  const { orgId } = await getSessionContext();

  const deal = await prisma.deal.findFirst({
    where: { id: dealId, orgId },
    select: { contactId: true },
  });

  if (!deal?.contactId) return { conversationId: null, messages: [] };

  const conversation = await prisma.conversation.findFirst({
    where: { orgId, contactId: deal.contactId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  if (!conversation) return { conversationId: null, messages: [] };

  return {
    conversationId: conversation.id,
    messages: conversation.messages.map((m) => ({
      id: m.id,
      body: m.body,
      fromExternal: m.fromExternal,
      createdAt: m.createdAt.toISOString(),
      authorName: m.author?.name ?? null,
    })),
  };
}

export async function sendChatMessage(
  dealId: string,
  text: string
): Promise<ChatMessage> {
  const { userId, orgId } = await getSessionContext();

  const deal = await prisma.deal.findFirst({
    where: { id: dealId, orgId },
    select: { contactId: true },
  });
  if (!deal?.contactId) throw new Error("Deal has no associated contact");

  const conversation = await prisma.conversation.findFirst({
    where: { orgId, contactId: deal.contactId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, externalId: true },
  });
  if (!conversation) throw new Error("No active conversation found for this deal");

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      authorId: userId,
      fromExternal: false,
      body: text.trim(),
    },
    include: { author: { select: { name: true } } },
  });

  // Notify connector to deliver the message to the messenger (fire-and-forget)
  const connectorBase =
    process.env.CONNECTOR_API_URL ?? "https://connector.orinax.ai";
  fetch(`${connectorBase}/messages/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId: conversation.externalId ?? conversation.id,
      text: text.trim(),
    }),
  }).catch((err) =>
    console.error("[sendChatMessage] Connector request failed:", err)
  );

  return {
    id: message.id,
    body: message.body,
    fromExternal: false,
    createdAt: message.createdAt.toISOString(),
    authorName: message.author?.name ?? null,
  };
}
