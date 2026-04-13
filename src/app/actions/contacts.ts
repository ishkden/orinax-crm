"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface ContactDetail {
  id: string;
  serialNumber: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  position: string | null;
  primaryIM: string | null;
  notes: string | null;
  source: string;
  status: string;
  companyRel: { id: string; name: string } | null;
  channels: Array<{ id: string; type: string; value: string; isPrimary: boolean }>;
  deals: Array<{
    id: string;
    title: string;
    value: number;
    currency: string;
    serialNumber: number;
    stageRel: { name: string; color: string | null } | null;
  }>;
}

async function getOrgId() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;
  const member = await prisma.orgMember.findFirst({ where: { userId }, select: { orgId: true } });
  return member?.orgId ?? null;
}

export async function getContactBySerialNumber(serialNumber: number): Promise<ContactDetail | null> {
  const orgId = await getOrgId();
  if (!orgId) return null;

  const contact = await prisma.contact.findFirst({
    where: { serialNumber, orgId },
    include: {
      companyRel: { select: { id: true, name: true } },
      channels: { where: { isDeleted: false }, orderBy: { isPrimary: "desc" } },
      deals: {
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { stageRel: { select: { name: true, color: true } } },
      },
    },
  });

  if (!contact) return null;

  return {
    id: contact.id,
    serialNumber: contact.serialNumber,
    firstName: contact.firstName,
    lastName: contact.lastName,
    phone: contact.phone,
    email: contact.email,
    company: contact.company,
    position: contact.position,
    primaryIM: contact.primaryIM,
    notes: contact.notes,
    source: String(contact.source),
    status: String(contact.status),
    companyRel: contact.companyRel,
    channels: contact.channels.map((ch) => ({
      id: ch.id,
      type: String(ch.type),
      value: ch.value,
      isPrimary: ch.isPrimary,
    })),
    deals: contact.deals.map((d) => ({
      id: d.id,
      title: d.title,
      value: d.value ?? 0,
      currency: d.currency ?? "RUB",
      serialNumber: d.serialNumber,
      stageRel: d.stageRel ? { name: d.stageRel.name, color: d.stageRel.color } : null,
    })),
  };
}

export async function getContactsList(page: number, pageSize: number) {
  const orgId = await getOrgId();
  if (!orgId) return { contacts: [], total: 0 };

  const where = { orgId, isDeleted: false };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        serialNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        company: true,
        position: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.contact.count({ where }),
  ]);

  return { contacts, total };
}

export async function getContactByCuid(id: string): Promise<ContactDetail | null> {
  const orgId = await getOrgId();
  if (!orgId) return null;

  const contact = await prisma.contact.findFirst({
    where: { id, orgId },
    include: {
      companyRel: { select: { id: true, name: true } },
      channels: { where: { isDeleted: false }, orderBy: { isPrimary: "desc" } },
      deals: {
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { stageRel: { select: { name: true, color: true } } },
      },
    },
  });

  if (!contact) return null;

  return {
    id: contact.id,
    serialNumber: contact.serialNumber,
    firstName: contact.firstName,
    lastName: contact.lastName,
    phone: contact.phone,
    email: contact.email,
    company: contact.company,
    position: contact.position,
    primaryIM: contact.primaryIM,
    notes: contact.notes,
    source: String(contact.source),
    status: String(contact.status),
    companyRel: contact.companyRel,
    channels: contact.channels.map((ch) => ({
      id: ch.id,
      type: String(ch.type),
      value: ch.value,
      isPrimary: ch.isPrimary,
    })),
    deals: contact.deals.map((d) => ({
      id: d.id,
      title: d.title,
      value: d.value ?? 0,
      currency: d.currency ?? "RUB",
      serialNumber: d.serialNumber,
      stageRel: d.stageRel ? { name: d.stageRel.name, color: d.stageRel.color } : null,
    })),
  };
}


// ─── Create Contact ──────────────────────────────────────────────────────────

export interface CreateContactInput {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  company?: string;
  position?: string;
  dealId?: string;
}

export async function createContact(input: CreateContactInput): Promise<ContactDetail> {
  const orgId = await getOrgId();
  if (!orgId) throw new Error("Unauthorized");

  const contact = await prisma.contact.create({
    data: {
      orgId,
      firstName: input.firstName.trim() || "Без имени",
      lastName: input.lastName.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      company: input.company?.trim() || null,
      position: input.position?.trim() || null,
      source: "MANUAL",
      status: "LEAD",
    },
  });

  if (input.dealId) {
    await prisma.$transaction([
      prisma.deal.update({
        where: { id: input.dealId, orgId },
        data: { contactId: contact.id },
      }),
      prisma.dealContact.create({
        data: {
          orgId,
          dealId: input.dealId,
          contactId: contact.id,
          isPrimary: true,
        },
      }),
    ]);
  }

  return {
    id: contact.id,
    serialNumber: contact.serialNumber,
    firstName: contact.firstName,
    lastName: contact.lastName,
    phone: contact.phone,
    email: contact.email,
    company: contact.company,
    position: contact.position,
    primaryIM: contact.primaryIM,
    notes: contact.notes,
    source: String(contact.source),
    status: String(contact.status),
    companyRel: null,
    channels: [],
    deals: [],
  };
}

// ─── Search + Link ────────────────────────────────────────────────────────────

export interface ContactSearchResult {
  id: string;
  serialNumber: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  company: string | null;
}

export async function searchContacts(query: string): Promise<ContactSearchResult[]> {
  const orgId = await getOrgId();
  if (!orgId || !query.trim()) return [];

  const q = query.trim().toLowerCase();

  const contacts = await prisma.contact.findMany({
    where: {
      orgId,
      isDeleted: false,
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      serialNumber: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      company: true,
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  return contacts;
}

export async function linkContactToDeal(dealId: string, contactId: string): Promise<void> {
  const orgId = await getOrgId();
  if (!orgId) throw new Error("Unauthorized");

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, orgId },
    select: { firstName: true, lastName: true, phone: true, email: true, company: true },
  });
  if (!contact) throw new Error("Contact not found");

  await prisma.$transaction([
    prisma.deal.update({
      where: { id: dealId, orgId },
      data: { contactId },
    }),
    prisma.dealContact.upsert({
      where: { dealId_contactId: { dealId, contactId } },
      create: { orgId, dealId, contactId, isPrimary: true },
      update: { isPrimary: true },
    }),
  ]);
}
