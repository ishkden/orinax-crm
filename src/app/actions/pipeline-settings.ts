"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getOrgId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) throw new Error("Unauthorized");
  const member = await prisma.orgMember.findFirst({
    where: { userId },
    select: { orgId: true },
  });
  if (!member) throw new Error("No org found");
  return member.orgId;
}

export type SettingsPipeline = {
  id: string;
  name: string;
  sortOrder: number;
  stages: SettingsStage[];
};

export type SettingsStage = {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  isFinal: boolean;
  isWon: boolean;
  semantics: string | null;
  _count: { deals: number };
};

export async function getSettingsPipelines(): Promise<SettingsPipeline[]> {
  const orgId = await getOrgId();
  const rows = await prisma.pipeline.findMany({
    where: { orgId },
    orderBy: { sortOrder: "asc" },
    include: {
      stages: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { deals: true } } },
      },
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
      isFinal: s.isFinal,
      isWon: s.isWon,
      semantics: s.semantics,
      _count: { deals: s._count.deals },
    })),
  }));
}

export async function createPipeline(name: string): Promise<SettingsPipeline> {
  const orgId = await getOrgId();
  const maxSort = await prisma.pipeline.aggregate({
    where: { orgId },
    _max: { sortOrder: true },
  });
  const nextSort = (maxSort._max.sortOrder ?? -1) + 1;

  const pipeline = await prisma.pipeline.create({
    data: {
      orgId,
      name,
      sortOrder: nextSort,
      stages: {
        create: [
          { orgId, name: "Новая", color: "#3B82F6", sortOrder: 0, isFinal: false, isWon: false },
          { orgId, name: "В работе", color: "#F59E0B", sortOrder: 1, isFinal: false, isWon: false },
          { orgId, name: "Успешно", color: "#22C55E", sortOrder: 100, isFinal: true, isWon: true, semantics: "WON" },
          { orgId, name: "Провалено", color: "#EF4444", sortOrder: 101, isFinal: true, isWon: false, semantics: "LOSE" },
        ],
      },
    },
    include: {
      stages: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { deals: true } } },
      },
    },
  });

  return {
    id: pipeline.id,
    name: pipeline.name,
    sortOrder: pipeline.sortOrder,
    stages: pipeline.stages.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      sortOrder: s.sortOrder,
      isFinal: s.isFinal,
      isWon: s.isWon,
      semantics: s.semantics,
      _count: { deals: s._count.deals },
    })),
  };
}

export async function renamePipeline(pipelineId: string, name: string): Promise<void> {
  const orgId = await getOrgId();
  await prisma.pipeline.updateMany({
    where: { id: pipelineId, orgId },
    data: { name },
  });
}

export async function deletePipeline(pipelineId: string): Promise<void> {
  const orgId = await getOrgId();
  const dealCount = await prisma.deal.count({ where: { pipelineId, orgId } });
  if (dealCount > 0) throw new Error("PIPELINE_HAS_DEALS");
  await prisma.stage.deleteMany({ where: { pipelineId, orgId } });
  await prisma.pipeline.delete({ where: { id: pipelineId, orgId } });
}

export async function addStageToP(
  pipelineId: string,
  name: string,
  color: string,
  sortOrder: number
): Promise<SettingsStage> {
  const orgId = await getOrgId();
  // Shift stages at and after the target sortOrder
  await prisma.stage.updateMany({
    where: { pipelineId, orgId, sortOrder: { gte: sortOrder } },
    data: { sortOrder: { increment: 1 } },
  });
  const stage = await prisma.stage.create({
    data: { orgId, pipelineId, name, color, sortOrder, isFinal: false, isWon: false },
    include: { _count: { select: { deals: true } } },
  });
  return {
    id: stage.id,
    name: stage.name,
    color: stage.color,
    sortOrder: stage.sortOrder,
    isFinal: stage.isFinal,
    isWon: stage.isWon,
    semantics: stage.semantics,
    _count: { deals: stage._count.deals },
  };
}

export async function updateStageSettings(
  stageId: string,
  updates: { name?: string; color?: string; isFinal?: boolean; isWon?: boolean; semantics?: string | null }
): Promise<void> {
  const orgId = await getOrgId();
  await prisma.stage.updateMany({
    where: { id: stageId, orgId },
    data: updates,
  });
}

export async function deleteStageSettings(stageId: string): Promise<void> {
  const orgId = await getOrgId();
  const dealCount = await prisma.deal.count({ where: { stageId, orgId } });
  if (dealCount > 0) throw new Error("STAGE_HAS_DEALS");
  await prisma.stage.delete({ where: { id: stageId, orgId } });
}

export async function reorderPipelineStages(stageIds: string[]): Promise<void> {
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
