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
import { useMemo, useRef, useState } from "react";
import KanbanColumn from "./KanbanColumn";
import DealCardStatic from "./DealCardStatic";
import type { Deal, Stage } from "./mockData";

interface KanbanBoardProps {
  stages: Stage[];
  deals: Deal[];
  onMoveDeal: (dealId: string, newStage: string) => void;
  onAddDeal?: (stageId: string) => void;
  onStageUpdate?: (stageId: string, updates: { label?: string; color?: string }) => void;
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

export default function KanbanBoard({
  stages,
  deals,
  onMoveDeal,
  onAddDeal,
  onStageUpdate,
  onContactClick,
  onDealClick,
}: KanbanBoardProps) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [totalsFrozen, setTotalsFrozen] = useState(false);
  const snapshotRef = useRef<Deal[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const stageTotals = useMemo(() => {
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

    if (!over) {
      setTotalsFrozen(false);
      snapshotRef.current = null;
      return;
    }

    const activeDealObj = deals.find((d) => d.id === active.id);
    if (!activeDealObj) {
      setTotalsFrozen(false);
      snapshotRef.current = null;
      return;
    }

    const overId = String(over.id);
    const isOverColumn = stages.some((s) => s.id === overId);

    if (isOverColumn) {
      onMoveDeal(String(active.id), overId);
    } else {
      const overDeal = deals.find((d) => d.id === overId);
      if (overDeal) {
        onMoveDeal(String(active.id), overDeal.stage);
      }
    }

    setTotalsFrozen(false);
    snapshotRef.current = null;
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex min-h-0 flex-1 items-stretch gap-3 overflow-x-auto overflow-y-hidden px-6 pb-4 pt-2">
          {stages.map((stage) => {
            const meta = stageTotals.get(stage.id) ?? { total: 0, currency: "RUB" };
            return (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                deals={deals.filter((d) => d.stage === stage.id)}
                committedStageTotal={meta.total}
                currencyForTotal={meta.currency}
                onAddDeal={onAddDeal}
                onStageUpdate={onStageUpdate}
                onContactClick={onContactClick}
                onDealClick={onDealClick}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <div className="pointer-events-none w-[212px] rotate-2 opacity-95">
              <DealCardStatic deal={activeDeal} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
