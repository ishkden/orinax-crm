"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CustomFieldType } from "@prisma/client";

// ─── Public types ─────────────────────────────────────────────────────────────

export type CustomFieldDef = {
  id: string;
  code: string;
  name: string;
  type: CustomFieldType;
  options: string[] | null;
  required: boolean;
  sortOrder: number;
};

export type { CustomFieldType };

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

function generateCode(): string {
  const digits = Math.floor(Math.random() * 1e12)
    .toString()
    .padStart(12, "0");
  return `ORX${digits}`;
}

function mapField(f: {
  id: string;
  code: string;
  name: string;
  type: CustomFieldType;
  options: unknown;
  required: boolean;
  sortOrder: number;
}): CustomFieldDef {
  return {
    id: f.id,
    code: f.code,
    name: f.name,
    type: f.type,
    options: Array.isArray(f.options) ? (f.options as string[]) : null,
    required: f.required,
    sortOrder: f.sortOrder,
  };
}

// ─── Server Actions ───────────────────────────────────────────────────────────

export async function getCustomFields(): Promise<CustomFieldDef[]> {
  const orgId = await getOrgId();
  const rows = await prisma.customField.findMany({
    where: { orgId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapField);
}

export async function createCustomField(data: {
  name: string;
  type: CustomFieldType;
  options?: string[];
  required?: boolean;
}): Promise<CustomFieldDef> {
  const orgId = await getOrgId();

  let code = generateCode();
  let attempt = 0;
  while (await prisma.customField.findUnique({ where: { code } })) {
    code = generateCode();
    if (++attempt > 10) throw new Error("Failed to generate unique code");
  }

  const count = await prisma.customField.count({ where: { orgId } });
  const field = await prisma.customField.create({
    data: {
      orgId,
      code,
      name: data.name.trim(),
      type: data.type,
      options: data.options && data.options.length > 0 ? data.options : null,
      required: data.required ?? false,
      sortOrder: count,
    },
  });
  return mapField(field);
}

export async function updateCustomField(
  id: string,
  data: {
    name?: string;
    options?: string[];
    required?: boolean;
  }
): Promise<CustomFieldDef> {
  const orgId = await getOrgId();
  const field = await prisma.customField.update({
    where: { id, orgId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.options !== undefined && {
        options: data.options.length > 0 ? data.options : null,
      }),
      ...(data.required !== undefined && { required: data.required }),
    },
  });
  return mapField(field);
}

export async function deleteCustomField(id: string): Promise<void> {
  const orgId = await getOrgId();
  await prisma.customField.delete({ where: { id, orgId } });
}

export async function reorderCustomFields(ids: string[]): Promise<void> {
  const orgId = await getOrgId();
  await Promise.all(
    ids.map((id, index) =>
      prisma.customField.update({
        where: { id, orgId },
        data: { sortOrder: index },
      })
    )
  );
}

export async function saveDealCustomFieldValues(
  dealId: string,
  values: Record<string, unknown>
): Promise<void> {
  const orgId = await getOrgId();
  await prisma.deal.update({
    where: { id: dealId, orgId },
    data: { customFieldValues: values },
  });
}
