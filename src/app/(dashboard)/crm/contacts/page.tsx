import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CrmRegisterPrimaryAction from "@/components/crm/CrmRegisterPrimaryAction";
import ContactsListClient from "@/components/crm/contacts/ContactsListClient";

async function getContacts() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return [];

  const member = await prisma.orgMember.findFirst({
    where: { userId },
    select: { orgId: true },
  });
  if (!member) return [];

  return prisma.contact.findMany({
    where: { orgId: member.orgId },
    orderBy: { createdAt: "desc" },
    include: { assigned: true },
  });
}

export default async function ContactsPage() {
  const contacts = await getContacts();

  return (
    <>
      <CrmRegisterPrimaryAction label="Добавить контакт" href="/crm/contacts/new" />
      <div className="flex-1 overflow-auto p-6">
        <ContactsListClient contacts={contacts} />
      </div>
    </>
  );
}
