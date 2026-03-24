"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Building2 } from "lucide-react";
import { cn, formatCurrency, getInitials } from "@/lib/utils";
import type { Deal } from "./mockData";
import { priorities } from "./mockData";

interface DealCardProps {
  deal: Deal;
}

export default function DealCard({ deal }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityInfo = priorities.find((p) => p.value === deal.priority);

  const isOverdue =
    deal.dueDate && new Date(deal.dueDate) < new Date() && deal.stage !== "won" && deal.stage !== "lost";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing touch-none",
        "hover:border-gray-300 hover:shadow-sm transition-all duration-150",
        isDragging && "opacity-50 shadow-lg rotate-2 z-50"
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: priorityInfo?.color ?? "#9CA3AF" }}
              title={priorityInfo?.label}
            />
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {deal.title}
            </h4>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <Building2 size={11} className="shrink-0 text-gray-400" />
            <span className="truncate">{deal.company}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-900">
              {formatCurrency(deal.value, deal.currency)}
            </span>

            <div className="flex items-center gap-2">
              {deal.dueDate && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-[11px]",
                    isOverdue ? "text-red-500" : "text-gray-400"
                  )}
                >
                  <Calendar size={10} />
                  {new Date(deal.dueDate).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}

              <div
                className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center shrink-0"
                title={deal.assignee}
              >
                <span className="text-brand-600 font-semibold text-[9px] leading-none">
                  {getInitials(deal.assignee)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
