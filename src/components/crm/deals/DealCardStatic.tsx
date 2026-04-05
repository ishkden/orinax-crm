"use client";

import { Calendar } from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";
import { CLOSED_STAGE_IDS } from "./types";
import { useKanbanStyles } from "./KanbanStyleContext";
import type { Deal } from "./types";

const lineHeightMap = { tight: 1.25, snug: 1.375, normal: 1.5, relaxed: 1.625 };

export default function DealCardStatic({
  deal,
  onContactClick,
}: {
  deal: Deal;
  onContactClick?: (deal: Deal) => void;
  onDealClick?: (deal: Deal) => void;
}) {
  const s = useKanbanStyles();

  const isOverdue =
    deal.dueDate &&
    new Date(deal.dueDate) < new Date() &&
    !CLOSED_STAGE_IDS.has(deal.stage);

  return (
    <div
      style={{
        ...(s.card.width > 0 ? { width: s.card.width, maxWidth: s.card.width } : { width: "100%" }),
        minHeight: s.card.minHeight,
        borderRadius: s.card.borderRadius,
        backgroundColor: s.card.backgroundColor,
        borderColor: s.card.borderColor,
        padding: `${s.card.paddingY}px ${s.card.paddingX}px`,
      }}
      className="group flex cursor-grabbing flex-col border text-left shadow-xl transition-all duration-150"
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {s.cardTitle.show && (
          <h4
            style={{
              fontSize: s.cardTitle.fontSize,
              fontWeight: s.cardTitle.fontWeight,
              lineHeight: lineHeightMap[s.cardTitle.lineHeight],
              color: s.cardTitle.textColor,
            }}
            className="break-words"
          >
            {deal.title}
          </h4>
        )}

        {s.cardValue.show && (
          <p
            style={{
              fontSize: s.cardValue.fontSize,
              fontWeight: s.cardValue.fontWeight,
              color: s.cardValue.textColor,
              marginTop: s.cardValue.marginTop,
            }}
            className="tabular-nums"
          >
            {formatCurrency(deal.value, deal.currency)}
          </p>
        )}

        {s.cardContact.show && (
          <button
            type="button"
            data-contact-link
            onClick={(e) => {
              e.stopPropagation();
              onContactClick?.(deal);
            }}
            style={{
              fontSize: s.cardContact.fontSize,
              fontWeight: s.cardContact.fontWeight,
              color: s.cardContact.textColor,
              marginTop: s.cardContact.marginTop,
            }}
            className="inline-flex max-w-full items-center text-left hover:underline hover:underline-offset-2"
          >
            <span className="min-w-0 break-words">{deal.contactName}</span>
          </button>
        )}

        {s.cardFooter.show && (deal.dueDate || deal.assignee) && (
          <div
            style={{
              borderTopColor: s.cardFooter.borderColor,
              paddingTop: s.cardFooter.paddingTop,
              gap: s.cardFooter.gap,
            }}
            className="mt-auto flex shrink-0 flex-wrap items-center border-t"
          >
            {s.cardDate.show && deal.dueDate && (
              <span
                style={{
                  fontSize: s.cardDate.fontSize,
                  color: isOverdue ? s.cardDate.overdueColor : s.cardDate.normalColor,
                  fontWeight: isOverdue ? 500 : 400,
                }}
                className="inline-flex items-center gap-1"
              >
                <Calendar size={s.cardDate.iconSize} />
                {new Date(deal.dueDate).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}

            {s.cardAssignee.show && deal.assignee && (
              <div
                style={{
                  width: s.cardAssignee.size,
                  height: s.cardAssignee.size,
                  backgroundColor: s.cardAssignee.backgroundColor,
                }}
                className="flex shrink-0 items-center justify-center rounded-full"
                title={deal.assignee}
              >
                <span
                  style={{
                    fontSize: s.cardAssignee.fontSize,
                    fontWeight: s.cardAssignee.fontWeight,
                    color: s.cardAssignee.textColor,
                  }}
                  className="leading-none"
                >
                  {getInitials(deal.assignee)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
