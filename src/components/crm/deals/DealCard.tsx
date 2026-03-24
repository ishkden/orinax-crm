"use client";

import { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, User } from "lucide-react";
import { cn, formatCurrency, getInitials } from "@/lib/utils";
import type { Deal } from "./mockData";
import { priorities } from "./mockData";

interface DealCardProps {
  deal: Deal;
  onContactClick?: (deal: Deal) => void;
  onDealClick?: (deal: Deal) => void;
}

export default function DealCard({ deal, onContactClick, onDealClick }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const pointerStart = useRef<{ x: number; y: number } | null>(null);

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
      onPointerDown={(e) => {
        listeners?.onPointerDown?.(e);
        if (e.button === 0) {
          pointerStart.current = { x: e.clientX, y: e.clientY };
        }
      }}
      onPointerUp={(e) => {
        listeners?.onPointerUp?.(e);
        if (!pointerStart.current || e.button !== 0) {
          pointerStart.current = null;
          return;
        }
        const dx = Math.abs(e.clientX - pointerStart.current.x);
        const dy = Math.abs(e.clientY - pointerStart.current.y);
        pointerStart.current = null;
        if (dx >= 10 || dy >= 10) return;
        const el = e.target as HTMLElement;
        if (el.closest("[data-contact-link]")) return;
        onDealClick?.(deal);
      }}
      className={cn(
        "group flex flex-col bg-white rounded-lg border border-gray-200 px-3 py-3 min-h-[168px] cursor-grab active:cursor-grabbing touch-none",
        "hover:border-gray-300 hover:shadow-md transition-all duration-150",
        isDragging && "opacity-50 shadow-xl rotate-1 z-50"
      )}
    >
      <div className="flex flex-1 flex-col min-h-0 min-w-0">
        <div className="flex items-start gap-1.5 mb-2 shrink-0">
          <span
            className="w-2 h-2 rounded-full shrink-0 mt-1"
            style={{ backgroundColor: priorityInfo?.color ?? "#9CA3AF" }}
            title={priorityInfo?.label}
          />
          <h4 className="text-sm leading-snug font-medium text-gray-900 line-clamp-4 min-h-[2.5rem]">
            {deal.title}
          </h4>
        </div>

        <div className="pl-3 mb-2 shrink-0">
          <button
            type="button"
            data-contact-link
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onContactClick?.(deal);
            }}
            className="inline-flex items-center gap-1.5 text-left text-xs text-brand-600 hover:text-brand-700 hover:underline underline-offset-2 max-w-full"
          >
            <User size={12} className="shrink-0 opacity-80" />
            <span className="truncate font-medium">{deal.contactName}</span>
          </button>
        </div>

        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-2 pl-3 shrink-0">
          <span className="text-sm text-gray-900 tabular-nums font-normal">
            {formatCurrency(deal.value, deal.currency)}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            {deal.dueDate && (
              <span
                className={cn(
                  "flex items-center gap-1 text-[11px]",
                  isOverdue ? "text-red-500 font-medium" : "text-gray-400"
                )}
              >
                <Calendar size={11} />
                {new Date(deal.dueDate).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}

            <div
              className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center shrink-0"
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
  );
}
