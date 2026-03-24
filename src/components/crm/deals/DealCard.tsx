"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, User } from "lucide-react";
import { cn, formatCurrency, getInitials } from "@/lib/utils";
import type { Deal } from "./mockData";
import { priorities } from "./mockData";

interface DealCardProps {
  deal: Deal;
  onContactClick?: (deal: Deal) => void;
}

export default function DealCard({ deal, onContactClick }: DealCardProps) {
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
        "group bg-white rounded-xl border border-gray-200 p-4 cursor-grab active:cursor-grabbing touch-none",
        "hover:border-gray-300 hover:shadow-md transition-all duration-150",
        isDragging && "opacity-50 shadow-xl rotate-1 z-50"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
              style={{ backgroundColor: priorityInfo?.color ?? "#9CA3AF" }}
              title={priorityInfo?.label}
            />
            <h4 className="text-[15px] leading-snug font-semibold text-gray-900">
              {deal.title}
            </h4>
          </div>

          <div className="pl-4 mb-3">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onContactClick?.(deal);
              }}
              className="inline-flex items-center gap-2 text-left text-sm text-brand-600 hover:text-brand-700 hover:underline underline-offset-2 max-w-full"
            >
              <User size={14} className="shrink-0 opacity-80" />
              <span className="truncate font-medium">{deal.contactName}</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pl-4">
            <span className="text-base font-bold text-gray-900 tabular-nums">
              {formatCurrency(deal.value, deal.currency)}
            </span>

            <div className="flex items-center gap-2.5 shrink-0">
              {deal.dueDate && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    isOverdue ? "text-red-500 font-medium" : "text-gray-400"
                  )}
                >
                  <Calendar size={12} />
                  {new Date(deal.dueDate).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}

              <div
                className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0"
                title={deal.assignee}
              >
                <span className="text-brand-600 font-semibold text-[10px] leading-none">
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
