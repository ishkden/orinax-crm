"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getSessionContext(): Promise<{ userId: string; orgId: string; userName: string }> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; name?: string; lastName?: string } | undefined;
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  const member = await prisma.orgMember.findFirst({
    where: { userId },
    select: {
      orgId: true,
      user: { select: { name: true, lastName: true } },
    },
  });
  if (!member) throw new Error("No org found for this user");

  const firstName = member.user?.name ?? "";
  const lastName = member.user?.lastName ?? "";
  const userName = [firstName, lastName].filter(Boolean).join(" ") || "Сотрудник";

  return { userId, orgId: member.orgId, userName };
}

export async function logDealEvent(
  dealId: string,
  action: string,
  field?: string | null,
  fromValue?: string | null,
  toValue?: string | null,
): Promise<void> {
  try {
    const { userId, orgId, userName } = await getSessionContext();
    await prisma.dealHistory.create({
      data: {
        orgId,
        dealId,
        userId,
        userName,
        action,
        field: field ?? null,
        fromValue: fromValue ?? null,
        toValue: toValue ?? null,
      },
    });
  } catch {
    // never block the main operation
  }
}

export type DealHistoryItem = {
  id: string;
  userName: string | null;
  action: string;
  field: string | null;
  fromValue: string | null;
  toValue: string | null;
  createdAt: string;
};

export async function getDealHistory(
  dealId: string,
  page = 1,
  pageSize = 50,
): Promise<{ items: DealHistoryItem[]; total: number }> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return { items: [], total: 0 };

  const member = await prisma.orgMember.findFirst({
    where: { userId },
    select: { orgId: true },
  });
  if (!member) return { items: [], total: 0 };

  const where = { dealId, orgId: member.orgId };
  const skip = (page - 1) * pageSize;

  const [rows, total] = await Promise.all([
    prisma.dealHistory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip,
    }),
    prisma.dealHistory.count({ where }),
  ]);

  return {
    items: rows.map((r) => ({
      id: r.id,
      userName: r.userName,
      action: r.action,
      field: r.field,
      fromValue: r.fromValue,
      toValue: r.toValue,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
  };
}
