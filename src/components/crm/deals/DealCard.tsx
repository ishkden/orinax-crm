"use client";

import { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar } from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";
import { CLOSED_STAGE_IDS } from "./types";
import { useKanbanStyles } from "./KanbanStyleContext";
import type { Deal } from "./types";

interface DealCardProps {
  deal: Deal;
  onContactClick?: (deal: Deal) => void;
  onDealClick?: (deal: Deal) => void;
}

const lineHeightMap = { tight: 1.25, snug: 1.375, normal: 1.5, relaxed: 1.625 };

const MONTHS = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];

function formatCreatedAt(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMinutes < 1) return "только что";
  if (diffMinutes < 60) return `${diffMinutes} мин. назад`;
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    return `сегодня, ${h}:${m}`;
  }
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
const shadowMap = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
};

export default function DealCard({ deal, onContactClick, onDealClick }: DealCardProps) {
  const s = useKanbanStyles();
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
    deal.dueDate &&
    new Date(deal.dueDate) < new Date() &&
    !CLOSED_STAGE_IDS.has(deal.stage);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        ...(s.card.width > 0 ? { width: s.card.width, maxWidth: s.card.width } : { width: "100%" }),
        minHeight: s.card.minHeight,
        borderRadius: s.card.borderRadius,
        backgroundColor: s.card.backgroundColor,
        borderColor: s.card.borderColor,
        padding: `${s.card.paddingY}px ${s.card.paddingX}px`,
        ...(isDragging
          ? {
              transform: [CSS.Transform.toString(transform), `rotate(${s.dragOverlay.draggingRotation}deg)`].filter(Boolean).join(" "),
              opacity: s.dragOverlay.draggingOpacity / 100,
              boxShadow: shadowMap.xl,
              zIndex: 50,
            }
          : {}),
      }}
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
      className="group flex cursor-grab flex-col border text-left touch-pan-y active:cursor-grabbing transition-all duration-150"
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = s.card.hoverBorderColor;
        el.style.boxShadow = isDragging ? shadowMap.xl : shadowMap[s.card.hoverShadow];
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = s.card.borderColor;
        if (!isDragging) el.style.boxShadow = "none";
      }}
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
            onPointerDown={(e) => e.stopPropagation()}
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
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = s.cardContact.hoverTextColor;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = s.cardContact.textColor;
            }}
          >
            <span className="min-w-0 break-words">{deal.contactName}</span>
          </button>
        )}

        {s.cardCreatedAt.show && deal.createdAt && (
          <span
            style={{
              fontSize: s.cardCreatedAt.fontSize,
              fontWeight: s.cardCreatedAt.fontWeight,
              color: s.cardCreatedAt.textColor,
              marginTop: s.cardCreatedAt.marginTop,
              textAlign: s.cardCreatedAt.textAlign,
              display: "block",
            }}
          >
            {formatCreatedAt(deal.createdAt)}
          </span>
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
