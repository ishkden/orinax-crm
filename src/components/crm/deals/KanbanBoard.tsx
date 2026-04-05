"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import KanbanColumn from "./KanbanColumn";
import KanbanColumnHeader from "./KanbanColumnHeader";
import DealCardStatic from "./DealCardStatic";
import { useKanbanStyles } from "./KanbanStyleContext";
import type { Deal, Stage } from "./types";
import type { StagePaginationState } from "./DealsClient";

interface KanbanBoardProps {
  stages: Stage[];
  deals: Deal[];
  stagePagination?: StagePaginationState;
  serverStageTotals?: Record<string, { amount: number; currency: string }>;
  onLoadMore?: (stageId: string) => void;
  onMoveDeal: (dealId: string, newStage: string) => void;
  onStageCommit?: (dealId: string, newStage: string, previousStage: string) => void;
  onAddDeal?: (stageId: string) => void;
  onStageUpdate?: (stageId: string, updates: { label?: string; color?: string }) => void;
  onStageDelete?: (stageId: string) => void;
  onContactClick?: (deal: Deal) => void;
  onDealClick?: (deal: Deal) => void;
}

function buildStageTotals(stages: Stage[], source: Deal[]) {
  const map = new Map<string, { total: number; currency: string }>();
  for (const s of stages) {
    const inStage = source.filter((d) => d.stage === s.id);
    const total = inStage.reduce((sum, d) => sum + d.value, 0);
    const currency = inStage[0]?.currency ?? "RUB";
    map.set(s.id, { total, currency });
  }
  return map;
}

// KanbanBoard fills 100% of its sticky wrapper (100dvh - 48px).
// Cards height = 100% minus the header row height.

export default function KanbanBoard({
  stages,
  deals,
  stagePagination,
  serverStageTotals,
  onLoadMore,
  onMoveDeal,
  onStageCommit,
  onAddDeal,
  onStageUpdate,
  onStageDelete,
  onContactClick,
  onDealClick,
}: KanbanBoardProps) {
  const ks = useKanbanStyles();
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [totalsFrozen, setTotalsFrozen] = useState(false);
  const snapshotRef = useRef<Deal[] | null>(null);

  // Measure sticky header row height to compute cards area height
  const headerRowRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(130);

  useLayoutEffect(() => {
    const el = headerRowRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h =
        entries[0]?.borderBoxSize?.[0]?.blockSize ?? entries[0]?.contentRect?.height;
      if (h) setHeaderHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const loadedStageTotals = useMemo(() => {
    const src = totalsFrozen && snapshotRef.current ? snapshotRef.current : deals;
    return buildStageTotals(stages, src);
  }, [stages, deals, totalsFrozen]);

  function handleDragStart(event: DragStartEvent) {
    const deal = deals.find((d) => d.id === event.active.id);
    if (deal) {
      snapshotRef.current = deals.map((d) => ({ ...d }));
      setTotalsFrozen(true);
      setActiveDeal(deal);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeDealObj = deals.find((d) => d.id === active.id);
    if (!activeDealObj) return;
    const overId = String(over.id);
    const isOverColumn = stages.some((s) => s.id === overId);
    if (isOverColumn && activeDealObj.stage !== overId) {
      onMoveDeal(String(active.id), overId);
    } else {
      const overDeal = deals.find((d) => d.id === overId);
      if (overDeal && activeDealObj.stage !== overDeal.stage) {
        onMoveDeal(String(active.id), overDeal.stage);
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDeal(null);
    const originalStage = snapshotRef.current?.find(
      (d) => d.id === String(active.id)
    )?.stage;
    if (!over || !originalStage) {
      setTotalsFrozen(false);
      snapshotRef.current = null;
      return;
    }
    const overId = String(over.id);
    const isOverColumn = stages.some((s) => s.id === overId);
    let finalStage: string | null = null;
    if (isOverColumn) {
      finalStage = overId;
    } else {
      const overDeal = deals.find((d) => d.id === overId);
      if (overDeal) finalStage = overDeal.stage;
    }
    if (finalStage) {
      onMoveDeal(String(active.id), finalStage);
      if (finalStage !== originalStage) {
        onStageCommit?.(String(active.id), finalStage, originalStage);
      }
    }
    setTotalsFrozen(false);
    snapshotRef.current = null;
  }

  if (stages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 px-6">
        <div className="max-w-sm text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3"
                />
              </svg>
            </div>
          </div>
          <h3 className="mb-2 text-base font-semibold text-gray-800">
            Воронки не найдены
          </h3>
          <p className="text-sm leading-relaxed text-gray-500">
            Запустите синхронизацию данных в меню слева, чтобы построить доску
          </p>
        </div>
      </div>
    );
  }

  // Cards fill the remaining space inside the sticky wrapper (100% - header row)
  const cardsHeight = `calc(100% - ${headerHeight}px)`;

  const rowStyle = {
    gap: ks.board.columnGap,
    paddingLeft: ks.board.paddingX,
    paddingRight: ks.board.paddingX,
  };

  return (
    /*
     * overflow-x: auto  — single horizontal scroll context for both rows
     * overflow-y: clip   — clips vertical overflow without becoming a scroll container,
     *                      so position:sticky inside still sticks to #crm-scroll (page scroll)
     * marginTop: scrollPad — adds configurable white space above the board, increasing the
     *                        scroll distance before column headers stick to the top
     */
    <div style={{ height: "100%", overflowX: "auto", overflowY: "hidden" }}>
      {/* Column header row — sits at the top of the board (no sticky needed, board itself is sticky) */}
      <div
        ref={headerRowRef}
        className="flex bg-[#f9f9f9]"
        style={{ ...rowStyle, paddingTop: ks.board.paddingTop }}
      >
        {stages.map((stage) => {
          const pagination = stagePagination?.[stage.id];
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          const loadedMeta = loadedStageTotals.get(stage.id) ?? { total: 0, currency: "RUB" };
          const serverMeta = serverStageTotals?.[stage.id];
          const committedTotal = totalsFrozen
            ? loadedMeta.total
            : (serverMeta?.amount ?? loadedMeta.total);
          const committedCurrency = totalsFrozen
            ? loadedMeta.currency
            : (serverMeta?.currency ?? loadedMeta.currency);

          return (
            <div
              key={stage.id}
              style={{ width: ks.column.width, minWidth: ks.column.width, flexShrink: 0 }}
            >
              <KanbanColumnHeader
                stage={stage}
                totalCount={pagination?.total ?? stageDeals.length}
                committedStageTotal={committedTotal}
                currencyForTotal={committedCurrency}
                onAddDeal={onAddDeal}
                onStageUpdate={onStageUpdate}
                onStageDelete={onStageDelete}
              />
            </div>
          );
        })}
      </div>

      {/* Cards row — only the scrollable card area of each column */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          className="flex items-stretch"
          style={{
            ...rowStyle,
            paddingBottom: ks.board.paddingBottom,
            height: cardsHeight,
          }}
        >
          {stages.map((stage) => {
            const pagination = stagePagination?.[stage.id];
            const stageDeals = deals.filter((d) => d.stage === stage.id);
            const hasMore = pagination ? stageDeals.length < pagination.total : false;

            return (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                deals={stageDeals}
                hasMore={hasMore}
                isLoadingMore={pagination?.loading ?? false}
                onLoadMore={onLoadMore ? () => onLoadMore(stage.id) : undefined}
                onContactClick={onContactClick}
                onDealClick={onDealClick}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <div
              className="pointer-events-none"
              style={{
                width: ks.dragOverlay.width,
                transform: `rotate(${ks.dragOverlay.rotation}deg)`,
                opacity: ks.dragOverlay.opacity / 100,
              }}
            >
              <DealCardStatic deal={activeDeal} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
