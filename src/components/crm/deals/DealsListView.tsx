"use client";

import { ArrowUpDown, Building2, Calendar } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import type { Deal, Stage } from "./mockData";
import { priorities } from "./mockData";

interface DealsListViewProps {
  deals: Deal[];
  stages: Stage[];
  onDealClick?: (deal: Deal) => void;
}

const priorityBadgeVariant: Record<string, "default" | "info" | "warning" | "danger"> = {
  LOW: "default",
  MEDIUM: "info",
  HIGH: "warning",
  URGENT: "danger",
};

export default function DealsListView({ deals, stages, onDealClick }: DealsListViewProps) {
  const stageMap = Object.fromEntries(stages.map((s) => [s.id, s]));
  const totalValue = deals.reduce((s, d) => s + d.value, 0);

  return (
    <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Summary bar */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {deals.length} {deals.length === 1 ? "сделка" : "сделок"}
          </span>
          <span className="text-sm font-normal text-gray-900 tabular-nums">
            {formatCurrency(totalValue)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {["Сделка", "Компания", "Этап", "Приоритет", "Ответственный", "Сумма", "Срок"].map(
                  (h) => (
                    <th
                      key={h}
                      className={cn(
                        "px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider",
                        h === "Сумма" ? "text-right" : "text-left"
                      )}
                    >
                      <button className="inline-flex items-center gap-1 hover:text-gray-700 transition-colors">
                        {h}
                        <ArrowUpDown size={12} className="text-gray-300" />
                      </button>
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {deals.map((deal) => {
                const stage = stageMap[deal.stage];
                const pri = priorities.find((p) => p.value === deal.priority);
                const isOverdue =
                  deal.dueDate &&
                  new Date(deal.dueDate) < new Date() &&
                  deal.stage !== "won" &&
                  deal.stage !== "lost";
                return (
                  <tr
                    key={deal.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onDealClick?.(deal)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onDealClick?.(deal);
                      }
                    }}
                    className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{deal.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {deal.contactName}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <Building2 size={12} className="text-gray-400" />
                        {deal.company}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {stage && (
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          <span className="text-sm text-gray-700">
                            {stage.label}
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={priorityBadgeVariant[deal.priority] ?? "default"}>
                        {pri?.label ?? deal.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {deal.assignee}
                    </td>
                    <td className="px-4 py-3 text-right font-normal text-gray-900 tabular-nums">
                      {formatCurrency(deal.value, deal.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "flex items-center gap-1 text-sm",
                          isOverdue ? "text-red-500" : "text-gray-500"
                        )}
                      >
                        <Calendar size={12} />
                        {new Date(deal.dueDate).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {deals.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-400 text-sm">
                    Нет сделок по заданным фильтрам
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
