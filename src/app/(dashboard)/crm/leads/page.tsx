import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import CrmRegisterPrimaryAction from "@/components/crm/CrmRegisterPrimaryAction";
import { UserCheck } from "lucide-react";

async function getLeads() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return [];

  const member = await prisma.orgMember.findFirst({
    where: { userId },
    select: { orgId: true },
  });
  if (!member) return [];

  return prisma.lead.findMany({
    where: { orgId: member.orgId, isDeleted: false },
    orderBy: { createdAt: "desc" },
    include: {
      contact: { select: { firstName: true, lastName: true } },
      company: { select: { name: true } },
    },
    take: 200,
  });
}

function formatDate(d: Date) {
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

function formatMoney(value: number, currency: string) {
  if (!value) return "—";
  return `${value.toLocaleString("ru-RU")} ${currency}`;
}

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <>
      <CrmRegisterPrimaryAction label="Добавить лид" href="/crm/leads/new" />
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm text-gray-500">{leads.length} лидов</p>
          </div>

          {leads.length === 0 ? (
            <div className="px-6 py-24 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserCheck size={24} className="text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Лиды появятся здесь</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                Лиды — это первичные обращения из Битрикс24, которые ещё не стали сделками.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Название", "Контакт", "Компания", "Сумма", "Статус", "Добавлен"].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <span className="font-medium text-gray-900">{lead.title || `Лид #${lead.sourceId || lead.id.slice(-6)}`}</span>
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {lead.contact ? `${lead.contact.firstName} ${lead.contact.lastName}` : "—"}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {lead.company?.name || "—"}
                      </td>
                      <td className="px-6 py-3 text-gray-600 tabular-nums">
                        {formatMoney(lead.value, lead.currency)}
                      </td>
                      <td className="px-6 py-3">
                        {lead.statusSemantic === "S" ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Успех</span>
                        ) : lead.statusSemantic === "F" ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Провал</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">В работе</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-500 tabular-nums">{formatDate(lead.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
