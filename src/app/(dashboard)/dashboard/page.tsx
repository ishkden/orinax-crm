import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users, Briefcase, CheckSquare, TrendingUp } from "lucide-react";
import Badge from "@/components/ui/Badge";

async function getStats() {
  const [contacts, deals, tasks, recentDeals] = await Promise.all([
    prisma.contact.count(),
    prisma.deal.findMany({ where: { stage: { not: "CLOSED_LOST" } } }),
    prisma.task.count({ where: { status: "TODO" } }),
    prisma.deal.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { contact: true },
    }),
  ]);

  const totalPipeline = deals.reduce((sum, d) => sum + d.value, 0);
  const wonDeals = deals.filter((d) => d.stage === "CLOSED_WON");
  const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);

  return { contactCount: contacts, totalPipeline, wonValue, taskCount: tasks, recentDeals };
}

const stageLabels: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" | "purple" }> = {
  LEAD: { label: "Лид", variant: "default" },
  QUALIFIED: { label: "Квалифицирован", variant: "info" },
  PROPOSAL: { label: "КП отправлено", variant: "purple" },
  NEGOTIATION: { label: "Переговоры", variant: "warning" },
  CLOSED_WON: { label: "Закрыта ✓", variant: "success" },
  CLOSED_LOST: { label: "Проиграна", variant: "danger" },
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const stats = await getStats();

  const statCards = [
    {
      label: "Контакты",
      value: stats.contactCount,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Воронка (активные)",
      value: formatCurrency(stats.totalPipeline),
      icon: TrendingUp,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Закрытые сделки",
      value: formatCurrency(stats.wonValue),
      icon: Briefcase,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Задачи (открытые)",
      value: stats.taskCount,
      icon: CheckSquare,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <>
      <Header title={`Привет, ${session?.user?.name?.split(" ")[0] || ""}! 👋`} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`${color}`} size={22} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent deals */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Последние сделки</h2>
          </div>
          {stats.recentDeals.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              Нет сделок. Создайте первую!
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {stats.recentDeals.map((deal) => {
                const stage = stageLabels[deal.stage] ?? { label: deal.stage, variant: "default" as const };
                return (
                  <div key={deal.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{deal.title}</p>
                      {deal.contact && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {deal.contact.firstName} {deal.contact.lastName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={stage.variant}>{stage.label}</Badge>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(deal.value, deal.currency)}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(deal.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
