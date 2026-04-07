"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ─── Public types ─────────────────────────────────────────────────────────────

export type CustomFieldEntityType = "DEAL" | "CONTACT" | "COMPANY" | "LEAD";

export type CustomFieldType =
  | "STRING"
  | "TEXT"
  | "LIST"
  | "DATETIME"
  | "DATE"
  | "RESOURCE"
  | "ADDRESS"
  | "URL"
  | "FILE"
  | "MONEY"
  | "BOOLEAN"
  | "NUMBER";

export type CustomFieldDef = {
  id: string;
  code: string;
  name: string;
  type: CustomFieldType;
  entityType: CustomFieldEntityType;
  options: string[] | null;
  required: boolean;
  sortOrder: number;
};

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
  type: string;
  entityType: string;
  options: unknown;
  required: boolean;
  sortOrder: number;
}): CustomFieldDef {
  return {
    id: f.id,
    code: f.code,
    name: f.name,
    type: f.type as CustomFieldType,
    entityType: f.entityType as CustomFieldEntityType,
    options: Array.isArray(f.options) ? (f.options as string[]) : null,
    required: f.required,
    sortOrder: f.sortOrder,
  };
}

// ─── Server Actions ───────────────────────────────────────────────────────────

export async function getCustomFields(entityType?: CustomFieldEntityType): Promise<CustomFieldDef[]> {
  const orgId = await getOrgId();
  const rows = await prisma.customField.findMany({
    where: {
      orgId,
      ...(entityType ? { entityType } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapField);
}

export async function createCustomField(data: {
  name: string;
  type: string;
  entityType: CustomFieldEntityType;
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

  const count = await prisma.customField.count({ where: { orgId, entityType: data.entityType } });
  const field = await prisma.customField.create({
    data: {
      orgId,
      code,
      name: data.name.trim(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: data.type as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      entityType: data.entityType as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options: (data.options && data.options.length > 0 ? data.options : null) as any,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.options !== undefined) updateData.options = data.options.length > 0 ? data.options : null;
  if (data.required !== undefined) updateData.required = data.required;

  const field = await prisma.customField.update({
    where: { id, orgId },
    data: updateData,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { customFieldValues: values as any },
  });
}

export async function saveContactCustomFieldValues(
  contactId: string,
  values: Record<string, unknown>
): Promise<void> {
  const orgId = await getOrgId();
  await prisma.contact.update({
    where: { id: contactId, orgId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { customFieldValues: values as any },
  });
}

export async function saveCompanyCustomFieldValues(
  companyId: string,
  values: Record<string, unknown>
): Promise<void> {
  const orgId = await getOrgId();
  await prisma.company.update({
    where: { id: companyId, orgId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { customFieldValues: values as any },
  });
}

export async function saveLeadCustomFieldValues(
  leadId: string,
  values: Record<string, unknown>
): Promise<void> {
  const orgId = await getOrgId();
  await prisma.lead.update({
    where: { id: leadId, orgId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { customFieldValues: values as any },
  });
}
