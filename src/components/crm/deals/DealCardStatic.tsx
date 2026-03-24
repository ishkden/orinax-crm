"use client";

import { Calendar } from "lucide-react";
import { cn, formatCurrency, getInitials } from "@/lib/utils";
import { CLOSED_STAGE_IDS } from "./types";
import type { Deal } from "./types";

/** Same look as DealCard, without dnd sortable — for DragOverlay */
export default function DealCardStatic({
  deal,
  onContactClick,
  onDealClick,
}: {
  deal: Deal;
  onContactClick?: (deal: Deal) => void;
  onDealClick?: (deal: Deal) => void;
}) {
  const isOverdue =
    deal.dueDate &&
    new Date(deal.dueDate) < new Date() &&
    !CLOSED_STAGE_IDS.has(deal.stage);

  return (
    <div
      className={cn(
        "group flex min-h-[202px] cursor-grabbing flex-col rounded-lg border border-gray-200 bg-white px-3 py-3 text-left shadow-xl",
        "transition-all duration-150"
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

          {deal.assignee && (
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100"
              title={deal.assignee}
            >
              <span className="text-[9px] font-semibold leading-none text-brand-600">
                {getInitials(deal.assignee)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
