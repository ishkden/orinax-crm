"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Deal, CreateDealInput } from "@/components/crm/deals/types";
import { DealStage, Priority } from "@prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getOrgId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) throw new Error("Unauthorized");

  const member = await prisma.orgMember.findFirst({
    where: { userId },
    select: { orgId: true },
  });
  if (!member) throw new Error("No org found for this user");
  return member.orgId;
}

type PrismaDeaWithRelations = {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: DealStage;
  priority: Priority;
  contactId: string | null;
  assignedId: string | null;
  closeDate: Date | null;
  description: string | null;
  tags: string[];
  createdAt: Date;
  contact: {
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    company: string | null;
  } | null;
  assigned: { name: string | null } | null;
};

function mapDeal(d: PrismaDeaWithRelations): Deal {
  return {
    id: d.id,
    title: d.title,
    value: d.value,
    currency: d.currency,
    stage: d.stage as string,
    priority: d.priority as Deal["priority"],
    contactId: d.contactId,
    contactName: d.contact
      ? `${d.contact.firstName} ${d.contact.lastName}`.trim()
      : "—",
    contactPhone: d.contact?.phone ?? null,
    contactEmail: d.contact?.email ?? null,
    company: d.contact?.company ?? null,
    assignedId: d.assignedId,
    assignee: d.assigned?.name ?? null,
    dueDate: d.closeDate ? d.closeDate.toISOString() : null,
    description: d.description,
    tags: d.tags,
    createdAt: d.createdAt.toISOString(),
  };
}

const DEAL_INCLUDE = {
  contact: {
    select: {
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      company: true,
    },
  },
  assigned: { select: { name: true } },
} as const;

// ─── Server Actions ───────────────────────────────────────────────────────────

export async function getDeals(): Promise<Deal[]> {
  const orgId = await getOrgId();
  const rows = await prisma.deal.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    include: DEAL_INCLUDE,
  });
  return rows.map(mapDeal);
}

export async function updateDealStage(
  dealId: string,
  newStage: string
): Promise<void> {
  const orgId = await getOrgId();
  await prisma.deal.update({
    where: { id: dealId, orgId },
    data: { stage: newStage as DealStage },
  });
}

export async function createDeal(input: CreateDealInput): Promise<Deal> {
  const orgId = await getOrgId();
  const deal = await prisma.deal.create({
    data: {
      orgId,
      title: input.title || "Новая сделка",
      value: input.value,
      currency: "RUB",
      stage: input.stage as DealStage,
      priority: input.priority as Priority,
      closeDate: input.dueDate ? new Date(input.dueDate) : null,
    },
    include: DEAL_INCLUDE,
  });
  return mapDeal(deal);
}
