"use client";

import { useState, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Pencil, Check, X } from "lucide-react";
import { cn, formatCurrency, contrastTextOnHex } from "@/lib/utils";
import DealCard from "./DealCard";
import type { Deal, Stage } from "./mockData";

const PRESET_COLORS = [
  "#6B7280", "#3B82F6", "#6366F1", "#8B5CF6", "#F59E0B", "#10B981", "#EF4444", "#EC4899", "#14B8A6", "#0EA5E9",
];

interface KanbanColumnProps {
  stage: Stage;
  deals: Deal[];
  onAddDeal?: (stageId: string) => void;
  onStageUpdate?: (stageId: string, updates: { label?: string; color?: string }) => void;
}

export default function KanbanColumn({
  stage,
  deals,
  onAddDeal,
  onStageUpdate,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(stage.label);
  const [draftColor, setDraftColor] = useState(stage.color);

  const headerBg = editing ? draftColor : stage.color;
  const headerFg = contrastTextOnHex(headerBg);

  useEffect(() => {
    if (!editing) {
      setDraftLabel(stage.label);
      setDraftColor(stage.color);
    }
  }, [stage.label, stage.color, editing]);

  function saveEdit() {
    const label = draftLabel.trim() || stage.label;
    const color = /^#[0-9A-Fa-f]{6}$/.test(draftColor) ? draftColor : stage.color;
    onStageUpdate?.(stage.id, { label, color });
    setEditing(false);
  }

  function cancelEdit() {
    setDraftLabel(stage.label);
    setDraftColor(stage.color);
    setEditing(false);
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-gray-50/80 rounded-xl min-w-[280px] w-[280px] shrink-0 max-h-full overflow-hidden",
        "border border-transparent transition-colors duration-150",
        isOver && "border-brand-300 bg-brand-50/30"
      )}
    >
      {/* Colored title bar — full width */}
      <div
        className="rounded-t-xl px-3 py-2.5 flex items-center gap-2 min-h-[44px]"
        style={{ backgroundColor: headerBg, color: headerFg }}
      >
        {!editing ? (
          <>
            <h3 className="flex-1 flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate leading-tight">
                {stage.label}
              </span>
            </h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              className="shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
              title="Редактировать название и цвет"
            >
              <Pencil size={14} />
            </button>
            <span
              className="shrink-0 text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: headerFg === "#ffffff" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.12)",
                color: headerFg,
              }}
            >
              {deals.length}
            </span>
          </>
        ) : (
          <div className="flex flex-col gap-2 w-full" onClick={(e) => e.stopPropagation()}>
            <input
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              className="w-full text-sm font-semibold rounded-md px-2 py-1 border border-white/40 bg-white/95 text-gray-900"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") cancelEdit();
              }}
            />
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-medium opacity-90">
                Цвет
                <input
                  type="color"
                  value={draftColor}
                  onChange={(e) => setDraftColor(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border border-white/30 bg-transparent p-0"
                />
              </label>
              <div className="flex flex-wrap gap-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="h-8 w-8 rounded-md border border-white/20 ring-offset-1 shrink-0"
                    style={{ backgroundColor: c }}
                    onClick={() => setDraftColor(c)}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium hover:bg-black/10"
              >
                <X size={14} /> Отмена
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold hover:bg-black/10"
              >
                <Check size={14} /> Готово
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stage total — prominent */}
      <div className="px-3 pt-3 pb-2">
        <p className="text-lg font-bold text-gray-900 tracking-tight tabular-nums">
          {formatCurrency(totalValue)}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">сумма по стадии</p>
      </div>

      {/* Add deal — under the sum */}
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={() => onAddDeal?.(stage.id)}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/30 transition-colors"
        >
          <Plus size={16} />
          Добавить сделку
        </button>
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
    </div>
  );
}
