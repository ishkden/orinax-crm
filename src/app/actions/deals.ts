"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Deal, CreateDealInput } from "@/components/crm/deals/types";
import { DealStage, Priority } from "@prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

async function getOrgId(): Promise<string> {
  const { orgId } = await getSessionContext();
  return orgId;
}

// ─── Public serializable types ────────────────────────────────────────────────

export type DbStage = {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
};

export type DbPipeline = {
  id: string;
  name: string;
  sortOrder: number;
  stages: DbStage[];
};

export type ActivityItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  createdAt: string;
  author: string | null;
};

export type TaskItem = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: string | null;
};

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

export async function getPipelines(): Promise<DbPipeline[]> {
  const orgId = await getOrgId();
  const rows = await prisma.pipeline.findMany({
    where: { orgId },
    orderBy: { sortOrder: "asc" },
    include: {
      stages: { orderBy: { sortOrder: "asc" } },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    sortOrder: p.sortOrder,
    stages: p.stages.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      sortOrder: s.sortOrder,
    })),
  }));
}

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

export async function deleteStage(stageId: string): Promise<void> {
  const orgId = await getOrgId();
  // Detach deals from this stage before deleting
  await prisma.deal.updateMany({
    where: { stageId, orgId },
    data: { stageId: null },
  });
  await prisma.stage.delete({
    where: { id: stageId, orgId },
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

// ─── Activity Actions ─────────────────────────────────────────────────────────

export async function getDealActivities(dealId: string): Promise<ActivityItem[]> {
  const { orgId } = await getSessionContext();
  const rows = await prisma.activity.findMany({
    where: { dealId, orgId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });
  return rows.map((a) => ({
    id: a.id,
    type: a.type as string,
    title: a.title,
    body: a.body,
    createdAt: a.createdAt.toISOString(),
    author: a.user.name,
  }));
}

export async function createDealNote(dealId: string, text: string): Promise<void> {
  const { userId, orgId } = await getSessionContext();
  await prisma.activity.create({
    data: {
      orgId,
      dealId,
      userId,
      type: "NOTE",
      title: "Заметка",
      body: text.trim(),
    },
  });
}

// ─── Task Actions ─────────────────────────────────────────────────────────────

const TASK_STATUS_ORDER: Record<string, number> = {
  TODO: 0,
  IN_PROGRESS: 1,
  DONE: 2,
  CANCELLED: 3,
};

export async function getDealTasks(dealId: string): Promise<TaskItem[]> {
  const { orgId } = await getSessionContext();
  const rows = await prisma.task.findMany({
    where: { dealId, orgId },
    orderBy: { dueDate: "asc" },
    include: { assigned: { select: { name: true } } },
  });
  rows.sort(
    (a, b) =>
      (TASK_STATUS_ORDER[a.status] ?? 99) - (TASK_STATUS_ORDER[b.status] ?? 99)
  );
  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status as string,
    priority: t.priority as string,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    assignee: t.assigned?.name ?? null,
  }));
}

export async function toggleTaskStatus(
  taskId: string,
  isDone: boolean
): Promise<void> {
  const { orgId } = await getSessionContext();
  await prisma.task.update({
    where: { id: taskId, orgId },
    data: { status: isDone ? "DONE" : "TODO" },
  });
}

export async function createDealTask(
  dealId: string,
  title: string
): Promise<void> {
  const { userId, orgId } = await getSessionContext();
  await prisma.task.create({
    data: {
      orgId,
      dealId,
      assignedId: userId,
      title: title.trim(),
      status: "TODO",
      priority: "MEDIUM",
    },
  });
}
