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
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  onStageReorder?: (newStageIds: string[]) => void;
  onAddStageAfter?: (afterStageId: string) => void;
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

// Sortable wrapper for each stage column header
interface SortableStageHeaderProps {
  stage: Stage;
  totalCount: number;
  committedStageTotal: number;
  currencyForTotal: string;
  columnWidth: number;
  columnGap: number;
  onAddDeal?: (stageId: string) => void;
  onStageUpdate?: (stageId: string, updates: { label?: string; color?: string }) => void;
  onStageDelete?: (stageId: string) => void;
  onAddStageAfter?: (afterStageId: string) => void;
}

function SortableStageHeader({
  stage,
  totalCount,
  committedStageTotal,
  currencyForTotal,
  columnWidth,
  columnGap,
  onAddDeal,
  onStageUpdate,
  onStageDelete,
  onAddStageAfter,
}: SortableStageHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: columnWidth,
    minWidth: columnWidth,
    flexShrink: 0,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <KanbanColumnHeader
        stage={stage}
        totalCount={totalCount}
        committedStageTotal={committedStageTotal}
        currencyForTotal={currencyForTotal}
        onAddDeal={onAddDeal}
        onStageUpdate={onStageUpdate}
        onStageDelete={onStageDelete}
        onAddStageAfter={onAddStageAfter}
        dragHandleListeners={listeners}
        dragHandleAttributes={attributes}
        isDragging={isDragging}
      />
    </div>
  );
}

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
  onStageReorder,
  onAddStageAfter,
  onContactClick,
  onDealClick,
}: KanbanBoardProps) {
  const ks = useKanbanStyles();
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [totalsFrozen, setTotalsFrozen] = useState(false);
  const snapshotRef = useRef<Deal[] | null>(null);
  const frozenServerTotalsRef = useRef<Record<string, { amount: number; currency: string }> | null>(null);

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

  const dealSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );

  const stageSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const loadedStageTotals = useMemo(() => {
    const src = totalsFrozen && snapshotRef.current ? snapshotRef.current : deals;
    return buildStageTotals(stages, src);
  }, [stages, deals, totalsFrozen]);

  function handleDealDragStart(event: DragStartEvent) {
    const deal = deals.find((d) => d.id === event.active.id);
    if (deal) {
      snapshotRef.current = deals.map((d) => ({ ...d }));
      frozenServerTotalsRef.current = serverStageTotals ? { ...serverStageTotals } : null;
      setTotalsFrozen(true);
      setActiveDeal(deal);
    }
  }

  function handleDealDragOver(event: DragOverEvent) {
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

  function handleDealDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDeal(null);
    const originalStage = snapshotRef.current?.find(
      (d) => d.id === String(active.id)
    )?.stage;
    if (!over || !originalStage) {
      setTotalsFrozen(false);
      snapshotRef.current = null;
      frozenServerTotalsRef.current = null;
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
    frozenServerTotalsRef.current = null;
  }

  function handleStageDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = stages.findIndex((s) => s.id === active.id);
    const newIndex = stages.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(stages, oldIndex, newIndex);
    onStageReorder?.(reordered.map((s) => s.id));
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

  const cardsHeight = `calc(100% - ${headerHeight}px)`;

  const rowStyle = {
    paddingLeft: ks.board.paddingX,
    paddingRight: ks.board.paddingX,
  };

  const stageIds = stages.map((s) => s.id);

  return (
    <div style={{ height: "100%", overflowX: "auto", overflowY: "hidden" }}>
      {/* Stage header row — sortable */}
      <DndContext
        sensors={stageSensors}
        onDragEnd={handleStageDragEnd}
      >
        <SortableContext items={stageIds} strategy={horizontalListSortingStrategy}>
          <div
            ref={headerRowRef}
            className="flex bg-[#f9f9f9]"
            style={{ ...rowStyle, paddingTop: ks.board.paddingTop, gap: ks.board.columnGap }}
          >
            {stages.map((stage) => {
              const pagination = stagePagination?.[stage.id];
              const stageDeals = deals.filter((d) => d.stage === stage.id);
              const loadedMeta = loadedStageTotals.get(stage.id) ?? { total: 0, currency: "RUB" };
              const serverMeta = serverStageTotals?.[stage.id];
              const frozenMeta = frozenServerTotalsRef.current?.[stage.id];
              const committedTotal = totalsFrozen
                ? (frozenMeta?.amount ?? loadedMeta.total)
                : (serverMeta?.amount ?? loadedMeta.total);
              const committedCurrency = totalsFrozen
                ? (frozenMeta?.currency ?? loadedMeta.currency)
                : (serverMeta?.currency ?? loadedMeta.currency);

              return (
                <SortableStageHeader
                  key={stage.id}
                  stage={stage}
                  totalCount={pagination?.total ?? stageDeals.length}
                  committedStageTotal={committedTotal}
                  currencyForTotal={committedCurrency}
                  columnWidth={ks.column.width}
                  columnGap={ks.board.columnGap}
                  onAddDeal={onAddDeal}
                  onStageUpdate={onStageUpdate}
                  onStageDelete={onStageDelete}
                  onAddStageAfter={onAddStageAfter}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Cards row */}
      <DndContext
        sensors={dealSensors}
        collisionDetection={closestCorners}
        onDragStart={handleDealDragStart}
        onDragOver={handleDealDragOver}
        onDragEnd={handleDealDragEnd}
      >
        <div
          className="flex items-stretch"
          style={{
            ...rowStyle,
            paddingBottom: ks.board.paddingBottom,
            height: cardsHeight,
          }}
        >
          <div
            style={{
              display: "flex",
              flex: "1 0 auto",
              alignItems: "stretch",
              gap: ks.board.columnGap,
              backgroundColor: ks.column.backgroundColor,
              borderRadius: ks.column.borderRadius,
              opacity: ks.column.backgroundOpacity / 100,
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
