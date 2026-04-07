import { notFound } from "next/navigation";
import { getContactBySerialNumber, getContactsList } from "@/app/actions/contacts";
import CrmRegisterPrimaryAction from "@/components/crm/CrmRegisterPrimaryAction";
import ContactsListClient from "@/components/crm/contacts/ContactsListClient";

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}

export default async function ContactWithDrawerPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const serialNumber = Number(id);
  if (!Number.isInteger(serialNumber) || serialNumber <= 0) notFound();

  const pageSize = PAGE_SIZE_OPTIONS.includes(
    Number(sp.pageSize) as (typeof PAGE_SIZE_OPTIONS)[number]
  )
    ? (Number(sp.pageSize) as (typeof PAGE_SIZE_OPTIONS)[number])
    : 20;
  const page = Math.max(1, Number(sp.page) || 1);

  const [contact, { contacts, total }] = await Promise.all([
    getContactBySerialNumber(serialNumber),
    getContactsList(page, pageSize),
  ]);

  if (!contact) notFound();

  return (
    <>
      <CrmRegisterPrimaryAction label="Добавить контакт" href="/crm/contacts/new" />
      <div className="flex-1 overflow-auto p-6">
        <ContactsListClient
          contacts={contacts}
          total={total}
          page={page}
          pageSize={pageSize}
          selectedContact={contact}
        />
      </div>
    </>
  );
}
