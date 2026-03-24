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
import { useState } from "react";
import KanbanColumn from "./KanbanColumn";
import DealCard from "./DealCard";
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const deal = deals.find((d) => d.id === event.active.id);
    if (deal) setActiveDeal(deal);
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

    if (!over) return;

    const activeDealObj = deals.find((d) => d.id === active.id);
    if (!activeDealObj) return;

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
          {stages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              deals={deals.filter((d) => d.stage === stage.id)}
              onAddDeal={onAddDeal}
              onStageUpdate={onStageUpdate}
              onContactClick={onContactClick}
              onDealClick={onDealClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <div className="w-[212px] rotate-2 opacity-95 pointer-events-none">
              <DealCard deal={activeDeal} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
