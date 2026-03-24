import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { UserPlus } from "lucide-react";
import Link from "next/link";

async function getContacts() {
  return prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
    include: { assigned: true },
  });
}

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "info" }> = {
  LEAD: { label: "Лид", variant: "default" },
  PROSPECT: { label: "Потенциальный", variant: "info" },
  CUSTOMER: { label: "Клиент", variant: "success" },
  CHURNED: { label: "Ушёл", variant: "warning" },
};

export default async function ContactsPage() {
  const contacts = await getContacts();

  return (
    <>
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">{contacts.length} контактов</p>
            <Link
              href="/crm/contacts/new"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <UserPlus size={16} />
              Добавить
            </Link>
          </div>

          {contacts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-gray-400 text-sm">Нет контактов. Добавьте первый!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Компания</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Добавлен</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {contacts.map((c) => {
                    const status = statusConfig[c.status] ?? { label: c.status, variant: "default" as const };
                    return (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-indigo-600 font-semibold text-xs">
                                {c.firstName[0]}{c.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{c.firstName} {c.lastName}</p>
                              {c.position && <p className="text-xs text-gray-500">{c.position}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{c.company || "—"}</td>
                        <td className="px-6 py-4 text-gray-600">{c.email || "—"}</td>
                        <td className="px-6 py-4">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{formatDate(c.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

