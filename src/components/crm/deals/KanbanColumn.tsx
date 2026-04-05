"use client";

import { useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Loader2 } from "lucide-react";
import DealCard from "./DealCard";
import { useKanbanStyles } from "./KanbanStyleContext";
import type { Deal, Stage } from "./types";

interface KanbanColumnProps {
  stage: Stage;
  deals: Deal[];
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onContactClick?: (deal: Deal) => void;
  onDealClick?: (deal: Deal) => void;
}

export default function KanbanColumn({
  stage,
  deals,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onContactClick,
  onDealClick,
}: KanbanColumnProps) {
  const s = useKanbanStyles();
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onLoadMore?.();
      },
      { root: container, threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  return (
    <div
      className="flex h-full min-h-0 shrink-0 flex-col self-stretch"
      style={{ width: s.column.width, minWidth: s.column.width }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden border transition-colors duration-150"
        style={{
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: s.column.borderRadius,
          borderBottomRightRadius: s.column.borderRadius,
          backgroundColor: isOver ? s.column.dragOverBgColor : s.column.backgroundColor,
          borderColor: isOver ? s.column.dragOverBorderColor : "transparent",
          opacity: s.column.backgroundOpacity / 100,
        }}
      >
        <div
          ref={(el) => {
            setNodeRef(el);
            scrollContainerRef.current = el;
          }}
          className={`min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain pb-2 pt-1 [-webkit-overflow-scrolling:touch] ${s.card.width === 0 ? "px-0" : "px-2"}`}
        >
          <SortableContext
            items={deals.map((d) => d.id)}
            strategy={verticalListSortingStrategy}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: s.column.cardGap }}>
              {deals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onContactClick={onContactClick}
                  onDealClick={onDealClick}
                />
              ))}
            </div>
          </SortableContext>

          {deals.length === 0 && (
            <div
              className="flex items-center justify-center h-16"
              style={{ fontSize: s.emptyState.fontSize, color: s.emptyState.textColor }}
            >
              {s.emptyState.text}
            </div>
          )}

          {hasMore && <div ref={sentinelRef} className="h-2 w-full" />}

          {isLoadingMore && (
            <div className="flex items-center justify-center py-3">
              <Loader2 size={16} className="animate-spin" style={{ color: stage.color }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
