import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { Plus } from "lucide-react";
import Link from "next/link";

async function getTasks() {
  return prisma.task.findMany({
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: { contact: true, assigned: true },
  });
}

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  TODO: { label: "К выполнению", variant: "default" },
  IN_PROGRESS: { label: "В работе", variant: "info" },
  DONE: { label: "Готово", variant: "success" },
  CANCELLED: { label: "Отменена", variant: "danger" },
};

const priorityConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  LOW: { label: "Низкий", variant: "default" },
  MEDIUM: { label: "Средний", variant: "info" },
  HIGH: { label: "Высокий", variant: "warning" },
  URGENT: { label: "Срочный", variant: "danger" },
};

export default async function TasksPage() {
  const tasks = await getTasks();
  const openCount = tasks.filter((t) => t.status === "TODO" || t.status === "IN_PROGRESS").length;

  return (
    <>
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {openCount} открытых из {tasks.length}
            </p>
            <Link
              href="/tasks/new"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} />
              Новая задача
            </Link>
          </div>

          {tasks.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-gray-400 text-sm">Нет задач. Создайте первую!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {tasks.map((t) => {
                const status = statusConfig[t.status] ?? { label: t.status, variant: "default" as const };
                const priority = priorityConfig[t.priority] ?? { label: t.priority, variant: "default" as const };
                const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE";
                return (
                  <div key={t.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${t.status === "DONE" ? "bg-green-500" : t.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-gray-300"}`} />
                      <div>
                        <p className={`text-sm font-medium ${t.status === "DONE" ? "line-through text-gray-400" : "text-gray-900"}`}>
                          {t.title}
                        </p>
                        {t.contact && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {t.contact.firstName} {t.contact.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={priority.variant}>{priority.label}</Badge>
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {t.dueDate && (
                        <span className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                          {isOverdue ? "Просрочена: " : ""}{formatDate(t.dueDate)}
                        </span>
                      )}
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
