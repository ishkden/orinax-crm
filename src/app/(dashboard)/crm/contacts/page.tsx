import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CrmRegisterPrimaryAction from "@/components/crm/CrmRegisterPrimaryAction";
import ContactsListClient from "@/components/crm/contacts/ContactsListClient";

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

async function getContacts(page: number, pageSize: number) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return { contacts: [], total: 0 };

  const member = await prisma.orgMember.findFirst({
    where: { userId },
    select: { orgId: true },
  });
  if (!member) return { contacts: [], total: 0 };

  const where = { orgId: member.orgId, isDeleted: false };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { assigned: true },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.contact.count({ where }),
  ]);

  return { contacts, total };
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const params = await searchParams;
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(params.pageSize) as typeof PAGE_SIZE_OPTIONS[number])
    ? (Number(params.pageSize) as typeof PAGE_SIZE_OPTIONS[number])
    : 20;
  const page = Math.max(1, Number(params.page) || 1);

  const { contacts, total } = await getContacts(page, pageSize);

  return (
    <>
      <CrmRegisterPrimaryAction label="Добавить контакт" href="/crm/contacts/new" />
      <div className="flex-1 overflow-auto p-6">
        <ContactsListClient
          contacts={contacts}
          total={total}
          page={page}
          pageSize={pageSize}
        />
      </div>
    </>
  );
}
