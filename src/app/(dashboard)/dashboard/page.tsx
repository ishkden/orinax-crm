import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import PageTransition from "@/components/layout/PageTransition";
import Badge from "@/components/ui/Badge";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { formatDate } from "@/lib/utils";
import { Users, Briefcase, CheckSquare, TrendingUp } from "lucide-react";

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

const statCards = (stats: Awaited<ReturnType<typeof getStats>>) => [
  {
    label: "Контакты",
    value: stats.contactCount,
    isNumber: true,
    icon: Users,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    trend: null,
  },
  {
    label: "Воронка (активные)",
    value: stats.totalPipeline,
    isNumber: false,
    prefix: "₽",
    icon: TrendingUp,
    iconColor: "text-brand-500",
    iconBg: "bg-brand-50",
    trend: null,
  },
  {
    label: "Закрытые сделки",
    value: stats.wonValue,
    isNumber: false,
    prefix: "₽",
    icon: Briefcase,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50",
    trend: null,
  },
  {
    label: "Открытые задачи",
    value: stats.taskCount,
    isNumber: true,
    icon: CheckSquare,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
    trend: null,
  },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const stats = await getStats();
  const cards = statCards(stats);

  return (
    <PageTransition>
      <Header title={`Добро пожаловать, ${session?.user?.name?.split(" ")[0] || ""}!`} />
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map(({ label, value, isNumber, prefix, icon: Icon, iconColor, iconBg }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{label}</p>
                <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
                  <Icon className={iconColor} size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">
                {isNumber ? (
                  <AnimatedCounter value={value} />
                ) : (
                  <AnimatedCounter value={value} prefix={prefix} />
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Recent deals */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Последние сделки</h2>
            <span className="text-xs text-gray-400">5 последних</span>
          </div>

          {stats.recentDeals.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Briefcase size={18} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Нет сделок. Создайте первую!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {stats.recentDeals.map((deal) => {
                const stage = stageLabels[deal.stage] ?? { label: deal.stage, variant: "default" as const };
                return (
                  <div
                    key={deal.id}
                    className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/60 transition-colors duration-150"
                  >
                    <div className="min-w-0 mr-4">
                      <p className="text-sm font-medium text-gray-900 truncate">{deal.title}</p>
                      {deal.contact && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {deal.contact.firstName} {deal.contact.lastName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={stage.variant}>{stage.label}</Badge>
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">
                        {deal.value.toLocaleString("ru-RU")} {deal.currency}
                      </span>
                      <span className="text-xs text-gray-400 hidden sm:block">{formatDate(deal.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </PageTransition>
  );
}
