"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Types (Analytics service contract) ─────────────────────────────────────

export type MigrationTaskStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED";

export type MigrationStage =
  | "COMPANIES"
  | "CONTACTS"
  | "PIPELINES"
  | "STAGES"
  | "DEALS"
  | "MESSAGES"
  | "DONE";

export interface MigrationStageStats {
  processed: number;
  failed: number;
}

export type MigrationStats = Record<MigrationStage, MigrationStageStats>;

export interface MigrationStatusResponse {
  taskId: string;
  status: MigrationTaskStatus;
  stage: MigrationStage;
  cursor: string | null;
  batchSize: number;
  stats: MigrationStats;
  totalProcessed: number;
  totalFailed: number;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
  elapsedMs: number;
}

export type TriggerResult = {
  ok: boolean;
  message?: string;
};

// ─── Internal helpers ────────────────────────────────────────────────────────

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

export async function getSessionOrgId(): Promise<string> {
  return getOrgId();
}

// ─── Server Actions ──────────────────────────────────────────────────────────

export async function startMigration(): Promise<TriggerResult> {
  const analyticsUrl = process.env.ANALYTICS_API_URL;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "";
  const apiKey = process.env.MIGRATION_API_KEY;

  if (!analyticsUrl) {
    return { ok: false, message: "ANALYTICS_API_URL is not configured" };
  }

  let orgId: string;
  try {
    orgId = await getOrgId();
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Unauthorized",
    };
  }

  try {
    const res = await fetch(`${analyticsUrl}/api/migration/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orgId,
        targetApiUrl: `${appUrl}/api/v1`,
        targetApiKey: apiKey,
        batchSize: 50,
      }),
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

export async function getMigrationStatus(): Promise<MigrationStatusResponse | null> {
  const analyticsUrl = process.env.ANALYTICS_API_URL;
  if (!analyticsUrl) return null;

  let orgId: string;
  try {
    orgId = await getOrgId();
  } catch {
    return null;
  }

  try {
    const res = await fetch(
      `${analyticsUrl}/api/migration/status?orgId=${encodeURIComponent(orgId)}`,
      { cache: "no-store" }
    );

    if (!res.ok) return null;
    return (await res.json()) as MigrationStatusResponse;
  } catch {
    return null;
  }
}

// ─── Legacy aliases ───────────────────────────────────────────────────────────

/** @deprecated use startMigration() */
export async function triggerMigration(_orgId: string): Promise<TriggerResult> {
  return startMigration();
}

/** @deprecated use getMigrationStatus() */
export async function fetchMigrationStatus(
  _orgId: string
): Promise<MigrationStatusResponse | null> {
  return getMigrationStatus();
}
