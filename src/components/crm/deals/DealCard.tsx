"use client";

import { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar } from "lucide-react";
import { cn, formatCurrency, getInitials } from "@/lib/utils";
import type { Deal } from "./mockData";

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
        "group flex min-h-[202px] cursor-grab flex-col rounded-lg border border-gray-200 bg-white px-3 py-3 text-left touch-pan-y active:cursor-grabbing",
        "transition-all duration-150 hover:border-gray-300 hover:shadow-md",
        isDragging && "z-50 rotate-1 opacity-50 shadow-xl"
      )}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <h4 className="break-words text-[11px] font-medium leading-snug text-gray-800">
          {deal.title}
        </h4>

        <p className="mt-1.5 text-sm font-normal tabular-nums text-gray-900">
          {formatCurrency(deal.value, deal.currency)}
        </p>

        <button
          type="button"
          data-contact-link
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onContactClick?.(deal);
          }}
          className="mt-1.5 inline-flex max-w-full items-center text-left text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline hover:underline-offset-2"
        >
          <span className="min-w-0 break-words">{deal.contactName}</span>
        </button>

        <div className="mt-auto flex shrink-0 flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
          {deal.dueDate && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px]",
                isOverdue ? "font-medium text-red-500" : "text-gray-400"
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
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100"
            title={deal.assignee}
          >
            <span className="text-[9px] font-semibold leading-none text-brand-600">
              {getInitials(deal.assignee)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
