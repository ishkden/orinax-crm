import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import { formatCurrency, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { Plus } from "lucide-react";
import Link from "next/link";

async function getDeals() {
  return prisma.deal.findMany({
    orderBy: { createdAt: "desc" },
    include: { contact: true, assigned: true },
  });
}

const stageConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" | "purple" }> = {
  LEAD: { label: "Лид", variant: "default" },
  QUALIFIED: { label: "Квалифицирован", variant: "info" },
  PROPOSAL: { label: "КП отправлено", variant: "purple" },
  NEGOTIATION: { label: "Переговоры", variant: "warning" },
  CLOSED_WON: { label: "Закрыта ✓", variant: "success" },
  CLOSED_LOST: { label: "Проиграна", variant: "danger" },
};

const priorityConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  LOW: { label: "Низкий", variant: "default" },
  MEDIUM: { label: "Средний", variant: "info" },
  HIGH: { label: "Высокий", variant: "warning" },
  URGENT: { label: "Срочный", variant: "danger" },
};

export default async function DealsPage() {
  const deals = await getDeals();
  const totalValue = deals.reduce((s, d) => s + d.value, 0);

  return (
    <>
      <Header title="Сделки" />
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500">{deals.length} сделок</p>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(totalValue)} в воронке
              </span>
            </div>
            <Link
              href="/deals/new"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} />
              Новая сделка
            </Link>
          </div>

          {deals.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-gray-400 text-sm">Нет сделок. Создайте первую!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Сделка</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Контакт</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Этап</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Приоритет</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Создана</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {deals.map((d) => {
                    const stage = stageConfig[d.stage] ?? { label: d.stage, variant: "default" as const };
                    const priority = priorityConfig[d.priority] ?? { label: d.priority, variant: "default" as const };
                    return (
                      <tr key={d.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{d.title}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {d.contact ? `${d.contact.firstName} ${d.contact.lastName}` : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={stage.variant}>{stage.label}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={priority.variant}>{priority.label}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          {formatCurrency(d.value, d.currency)}
                        </td>
                        <td className="px-6 py-4 text-gray-400">{formatDate(d.createdAt)}</td>
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
