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
  serialNumber: number;
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
  stageId: string | null;
  pipelineId: string | null;
  companyId: string | null;
  lastActivityTime: Date | null;
  customFieldValues: unknown;
  contact: {
    serialNumber: number;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    company: string | null;
  } | null;
  company: {
    name: string;
  } | null;
  assigned: { name: string | null } | null;
};

function mapDeal(d: PrismaDeaWithRelations): Deal {
  return {
    id: d.id,
    serialNumber: d.serialNumber,
    title: d.title,
    value: d.value,
    currency: d.currency,
    stage: d.stageId || d.stage as string,
    contactId: d.contactId,
    contactSerialNumber: d.contact?.serialNumber ?? null,
    contactName: d.contact
      ? `${d.contact.firstName} ${d.contact.lastName}`.trim()
      : "—",
    contactPhone: d.contact?.phone ?? null,
    contactEmail: d.contact?.email ?? null,
    company: d.company?.name ?? d.contact?.company ?? null,
    assignedId: d.assignedId,
    assignee: d.assigned?.name ?? null,
    description: d.description,
    tags: d.tags,
    createdAt: d.createdAt.toISOString(),
    stageId: d.stageId,
    pipelineId: d.pipelineId,
    lastActivityTime: d.lastActivityTime?.toISOString() ?? null,
    customFieldValues: (d.customFieldValues as Record<string, unknown>) ?? {},
  };
}

const DEAL_INCLUDE = {
  contact: {
    select: {
      serialNumber: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      company: true,
    },
  },
  company: { select: { name: true } },
  assigned: { select: { name: true } },
} as const;

const DEAL_SELECT_SCALAR = {
  id: true,
  serialNumber: true,
  title: true,
  value: true,
  currency: true,
  stage: true,
  priority: true,
  contactId: true,
  assignedId: true,
  closeDate: true,
  description: true,
  tags: true,
  createdAt: true,
  stageId: true,
  pipelineId: true,
  companyId: true,
  lastActivityTime: true,
  customFieldValues: true,
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
    where: { orgId, isDeleted: false },
    orderBy: { createdAt: "desc" },
    include: DEAL_INCLUDE,
  });
  return rows.map(mapDeal);
}

export async function getInitialDealsPerStage(
  stageIds: string[],
  limit = 20
): Promise<Record<string, { items: Deal[]; total: number }>> {
  const orgId = await getOrgId();
  const result: Record<string, { items: Deal[]; total: number }> = {};
  await Promise.all(
    stageIds.map(async (stageId) => {
      const [rows, total] = await Promise.all([
        prisma.deal.findMany({
          where: { orgId, isDeleted: false, stageId },
          orderBy: { createdAt: "desc" },
          take: limit,
          include: DEAL_INCLUDE,
        }),
        prisma.deal.count({ where: { orgId, isDeleted: false, stageId } }),
      ]);
      result[stageId] = { items: rows.map(mapDeal), total };
    })
  );
  return result;
}

export async function getStageAmountTotals(
  stageIds: string[]
): Promise<Record<string, { amount: number; currency: string }>> {
  const orgId = await getOrgId();
  const rows = await prisma.deal.groupBy({
    by: ["stageId", "currency"],
    where: { orgId, isDeleted: false, stageId: { in: stageIds } },
    _sum: { value: true },
  });
  const result: Record<string, { amount: number; currency: string }> = {};
  for (const row of rows) {
    if (!row.stageId) continue;
    if (!result[row.stageId]) {
      result[row.stageId] = { amount: 0, currency: row.currency };
    }
    result[row.stageId].amount += row._sum.value ?? 0;
  }
  return result;
}

export async function getDealsPage(
  stageId: string,
  page: number,
  limit = 20
): Promise<{ items: Deal[]; total: number }> {
  const orgId = await getOrgId();
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    prisma.deal.findMany({
      where: { orgId, isDeleted: false, stageId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      include: DEAL_INCLUDE,
    }),
    prisma.deal.count({ where: { orgId, isDeleted: false, stageId } }),
  ]);
  return { items: rows.map(mapDeal), total };
}

export async function updateDealStage(
  dealId: string,
  newStage: string
): Promise<void> {
  const orgId = await getOrgId();
  const isEnumStage = ["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"].includes(newStage);
  await prisma.deal.update({
    where: { id: dealId, orgId },
    data: isEnumStage
      ? { stage: newStage as DealStage }
      : { stageId: newStage },
  });
}

export async function updateDealPipeline(
  dealId: string,
  pipelineId: string,
  stageId: string
): Promise<void> {
  const orgId = await getOrgId();
  await prisma.deal.update({
    where: { id: dealId, orgId },
    data: { pipelineId, stageId },
  });
}


export async function deleteDeal(dealId: string): Promise<void> {
  const orgId = await getOrgId();
  await prisma.deal.update({
    where: { id: dealId, orgId },
    data: { isDeleted: true },
  });
}
export async function deleteStage(stageId: string): Promise<void> {
  const orgId = await getOrgId();
  const dealsCount = await prisma.deal.count({ where: { stageId, orgId } });
  if (dealsCount > 0) {
    throw new Error("STAGE_HAS_DEALS");
  }
  await prisma.stage.delete({ where: { id: stageId, orgId } });
}

export async function createDeal(input: CreateDealInput): Promise<Deal> {
  const orgId = await getOrgId();
  const ENUM_STAGES = ["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"];
  const isEnumStage = ENUM_STAGES.includes(input.stage);

  const deal = await prisma.deal.create({
    data: {
      orgId,
      title: input.title || "Новая сделка",
      value: input.value,
      currency: "RUB",
      ...(isEnumStage
        ? { stage: input.stage as DealStage }
        : { stageId: input.stage, pipelineId: input.pipelineId ?? null }),
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
    author: a.user?.name ?? null,
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

// ─── Full Deal Detail ─────────────────────────────────────────────────────────

export type DealContactItem = {
  id: string;
  isPrimary: boolean;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    company: string | null;
    position: string | null;
    primaryIM: string | null;
  };
};

export type StageHistoryItem = {
  id: string;
  movedAt: string;
  fromStage: { name: string; color: string | null } | null;
  toStage: { name: string; color: string | null };
};

export type CommentItem = {
  id: string;
  body: string;
  sourceId: string | null;
  createdAt: string;
  author: string | null;
};

export type FullDeal = {
  id: string;
  serialNumber: number;
  title: string;
  value: number;
  currency: string;
  sourceId: string | null;
  description: string | null;
  tags: string[];
  createdAt: string;
  closeDate: string | null;
  beginDate: string | null;
  dateCreate: string | null;
  dateModify: string | null;
  movedTime: string | null;
  lastActivityTime: string | null;
  sourceDescription: string | null;
  assignedByExternalId: string | null;
  rawPayload: Record<string, unknown> | null;
  isDeleted: boolean;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    company: string | null;
    position: string | null;
  } | null;
  company: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    inn: string | null;
  } | null;
  assigned: { name: string | null } | null;
  pipeline: { id: string; name: string } | null;
  stageRel: { id: string; name: string; color: string | null; isFinal: boolean; isWon: boolean } | null;
  allStages: { id: string; name: string; color: string | null; sortOrder: number; isFinal: boolean; isWon: boolean }[];
  dealContacts: DealContactItem[];
  activities: ActivityItem[];
  tasks: TaskItem[];
  comments: CommentItem[];
  stageHistory: StageHistoryItem[];
};

export async function getDealById(serialNumber: number): Promise<FullDeal | null> {
  const orgId = await getOrgId();

  const deal = await prisma.deal.findFirst({
    where: { serialNumber, orgId },
    include: {
      contact: {
        select: { id: true, firstName: true, lastName: true, phone: true, email: true, company: true, position: true },
      },
      company: {
        select: { id: true, name: true, phone: true, email: true, inn: true },
      },
      assigned: { select: { name: true } },
      pipeline: { select: { id: true, name: true } },
      stageRel: { select: { id: true, name: true, color: true, isFinal: true, isWon: true } },
      dealContacts: {
        where: { isDeleted: false },
        include: {
          contact: {
            select: { id: true, firstName: true, lastName: true, phone: true, email: true, company: true, position: true, primaryIM: true },
          },
        },
        orderBy: { isPrimary: "desc" },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { user: { select: { name: true } } },
      },
      tasks: {
        orderBy: { createdAt: "desc" },
        include: { assigned: { select: { name: true } } },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { user: { select: { name: true } } },
      },
      stageHistory: {
        orderBy: { movedAt: "desc" },
        include: {
          fromStage: { select: { name: true, color: true } },
          toStage: { select: { name: true, color: true } },
        },
      },
    },
  });

  if (!deal) return null;

  const allStages = deal.pipelineId
    ? await prisma.stage.findMany({
        where: { pipelineId: deal.pipelineId, orgId },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, color: true, sortOrder: true, isFinal: true, isWon: true },
      })
    : [];

  return {
    id: deal.id,
    serialNumber: deal.serialNumber,
    title: deal.title,
    value: deal.value,
    currency: deal.currency,
    sourceId: deal.sourceId,
    description: deal.description,
    tags: deal.tags,
    createdAt: deal.createdAt.toISOString(),
    closeDate: deal.closeDate?.toISOString() ?? null,
    beginDate: deal.beginDate?.toISOString() ?? null,
    dateCreate: deal.dateCreate?.toISOString() ?? null,
    dateModify: deal.dateModify?.toISOString() ?? null,
    movedTime: deal.movedTime?.toISOString() ?? null,
    lastActivityTime: deal.lastActivityTime?.toISOString() ?? null,
    sourceDescription: deal.sourceDescription,
    assignedByExternalId: deal.assignedByExternalId,
    rawPayload: deal.rawPayload as Record<string, unknown> | null,
    isDeleted: deal.isDeleted,
    contact: deal.contact,
    company: deal.company,
    assigned: deal.assigned,
    pipeline: deal.pipeline,
    stageRel: deal.stageRel,
    allStages,
    dealContacts: deal.dealContacts.map((dc) => ({
      id: dc.id,
      isPrimary: dc.isPrimary,
      contact: dc.contact,
    })),
    activities: deal.activities.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      body: a.body,
      createdAt: a.createdAt.toISOString(),
      author: a.user?.name ?? null,
    })),
    tasks: deal.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate?.toISOString() ?? null,
      assignee: t.assigned?.name ?? null,
    })),
    comments: deal.comments.map((c) => ({
      id: c.id,
      body: c.body,
      sourceId: c.sourceId,
      createdAt: c.createdAt.toISOString(),
      author: c.user?.name ?? null,
    })),
    stageHistory: deal.stageHistory.map((h) => ({
      id: h.id,
      movedAt: h.movedAt.toISOString(),
      fromStage: h.fromStage ? { name: h.fromStage.name, color: h.fromStage.color } : null,
      toStage: { name: h.toStage.name, color: h.toStage.color },
    })),
  };
}

// ─── Stage Reorder + Create ───────────────────────────────────────────────────

export async function reorderStages(stageIds: string[]): Promise<void> {
  const orgId = await getOrgId();
  await Promise.all(
    stageIds.map((id, index) =>
      prisma.stage.updateMany({
        where: { id, orgId },
        data: { sortOrder: index },
      })
    )
  );
}

export async function createStage(
  pipelineId: string,
  afterSortOrder: number,
  name: string,
  color: string
): Promise<DbStage> {
  const orgId = await getOrgId();
  await prisma.stage.updateMany({
    where: { pipelineId, orgId, sortOrder: { gt: afterSortOrder } },
    data: { sortOrder: { increment: 1 } },
  });
  const stage = await prisma.stage.create({
    data: { orgId, pipelineId, name, color, sortOrder: afterSortOrder + 1 },
  });
  return { id: stage.id, name: stage.name, color: stage.color, sortOrder: stage.sortOrder };
}
