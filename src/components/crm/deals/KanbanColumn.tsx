"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import DealCard from "./DealCard";
import type { Deal, Stage } from "./mockData";

interface KanbanColumnProps {
  stage: Stage;
  deals: Deal[];
  onAddDeal?: (stageId: string) => void;
}

export default function KanbanColumn({ stage, deals, onAddDeal }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div
      className={cn(
        "flex flex-col bg-gray-50/80 rounded-xl min-w-[280px] w-[280px] shrink-0 max-h-full",
        "border border-transparent transition-colors duration-150",
        isOver && "border-brand-300 bg-brand-50/30"
      )}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="text-sm font-semibold text-gray-800 truncate">
            {stage.label}
          </h3>
          <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-200/60 rounded-full px-2 py-0.5">
            {deals.length}
          </span>
        </div>
        {totalValue > 0 && (
          <p className="text-xs text-gray-400 pl-[18px]">
            {formatCurrency(totalValue)}
          </p>
        )}
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[60px]"
      >
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-gray-300">
            Перетащите сделку сюда
          </div>
        )}
      </div>

      {/* Add button */}
      <div className="px-2 pb-2">
        <button
          onClick={() => onAddDeal?.(stage.id)}
          className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 transition-colors"
        >
          <Plus size={14} />
          <span>Добавить</span>
        </button>
      </div>
    </div>
  );
}
