import { getContactsList } from "@/app/actions/contacts";
import CrmRegisterPrimaryAction from "@/components/crm/CrmRegisterPrimaryAction";
import ContactsListClient from "@/components/crm/contacts/ContactsListClient";

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

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

  const { contacts, total } = await getContactsList(page, pageSize);

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
