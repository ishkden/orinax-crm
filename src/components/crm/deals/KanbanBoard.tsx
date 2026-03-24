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
}

export default function KanbanBoard({
  stages,
  deals,
  onMoveDeal,
  onAddDeal,
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 px-6 flex-1 min-h-0">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            deals={deals.filter((d) => d.stage === stage.id)}
            onAddDeal={onAddDeal}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <div className="w-[264px] rotate-3 opacity-90">
            <DealCard deal={activeDeal} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
