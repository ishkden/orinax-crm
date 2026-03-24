"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export type MigrationStats = {
  companies: number;
  contacts: number;
  deals: number;
  messages: number;
};

export type MigrationStatus = {
  stage: string;
  cursor: string | null;
  stats: MigrationStats;
  elapsedMs: number;
};

export type TriggerResult = {
  ok: boolean;
  message?: string;
};

export async function triggerMigration(orgId: string): Promise<TriggerResult> {
  const analyticsUrl = process.env.ANALYTICS_API_URL;
  const apiKey = process.env.MIGRATION_API_KEY;
  const crmUrl = process.env.NEXTAUTH_URL;

  if (!analyticsUrl) {
    return { ok: false, message: "ANALYTICS_API_URL is not configured" };
  }

  try {
    const res = await fetch(`${analyticsUrl}/api/migration/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-API-Key": apiKey } : {}),
      },
      body: JSON.stringify({ orgId, crmUrl, apiKey }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return { ok: false, message: text };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function fetchMigrationStatus(
  orgId: string
): Promise<MigrationStatus | null> {
  const analyticsUrl = process.env.ANALYTICS_API_URL;
  const apiKey = process.env.MIGRATION_API_KEY;

  if (!analyticsUrl) return null;

  try {
    const res = await fetch(
      `${analyticsUrl}/api/migration/status?orgId=${encodeURIComponent(orgId)}`,
      {
        headers: apiKey ? { "X-API-Key": apiKey } : {},
        cache: "no-store",
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data as MigrationStatus;
  } catch {
    return null;
  }
}

export async function getSessionOrgId(): Promise<string> {
  return getOrgId();
}
