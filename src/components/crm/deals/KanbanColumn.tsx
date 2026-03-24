"use client";

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Pencil, Check, X } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { cn, formatCurrency, contrastTextOnHex } from "@/lib/utils";
import DealCard from "./DealCard";
import type { Deal, Stage } from "./mockData";

interface KanbanColumnProps {
  stage: Stage;
  deals: Deal[];
  onAddDeal?: (stageId: string) => void;
  onStageUpdate?: (stageId: string, updates: { label?: string; color?: string }) => void;
  onContactClick?: (deal: Deal) => void;
  onDealClick?: (deal: Deal) => void;
}

export default function KanbanColumn({
  stage,
  deals,
  onAddDeal,
  onStageUpdate,
  onContactClick,
  onDealClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(stage.label);
  const [draftColor, setDraftColor] = useState(stage.color);
  const headerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);

  const headerBg = editing ? draftColor : stage.color;
  const headerFg = contrastTextOnHex(/^#[0-9A-Fa-f]{6}$/.test(headerBg) ? headerBg : "#6366F1");

  const updatePanelPosition = useCallback(() => {
    const el = headerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const panelW = 288;
    let left = r.right + 8;
    if (left + panelW > window.innerWidth - 12) {
      left = r.left - panelW - 8;
    }
    if (left < 12) left = 12;
    let top = r.top;
    const maxTop = window.innerHeight - 360;
    if (top > maxTop) top = Math.max(12, maxTop);
    setPanelPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (editing) {
      updatePanelPosition();
    } else {
      setPanelPos(null);
    }
  }, [editing, updatePanelPosition]);

  useEffect(() => {
    if (!editing) return;
    function onResize() {
      updatePanelPosition();
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [editing, updatePanelPosition]);

  const cancelEdit = useCallback(() => {
    setDraftLabel(stage.label);
    setDraftColor(stage.color);
    setEditing(false);
  }, [stage.label, stage.color]);

  useEffect(() => {
    if (!editing) return;
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (headerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      cancelEdit();
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [editing, cancelEdit]);

  useEffect(() => {
    if (!editing) {
      setDraftLabel(stage.label);
      setDraftColor(stage.color);
    }
  }, [stage.label, stage.color, editing]);

  const saveEdit = useCallback(() => {
    const label = draftLabel.trim() || stage.label;
    const color = /^#[0-9A-Fa-f]{6}$/.test(draftColor) ? draftColor : stage.color;
    onStageUpdate?.(stage.id, { label, color });
    setEditing(false);
  }, [draftLabel, draftColor, stage.id, stage.label, onStageUpdate]);

  const pickerColor = /^#[0-9A-Fa-f]{6}$/.test(draftColor) ? draftColor : stage.color;

  return (
    <div className="flex shrink-0 flex-col">
      <div
        className={cn(
          "flex flex-col bg-gray-50/80 rounded-xl min-w-[228px] w-[228px] shrink-0 max-h-full overflow-visible",
          "border border-transparent transition-colors duration-150",
          isOver && "border-brand-300 bg-brand-50/30"
        )}
      >
        <div
          ref={headerRef}
          className="relative rounded-t-xl px-1.5 min-h-[34px] py-1 flex items-center justify-center"
          style={{
            backgroundColor: headerBg,
            color: headerFg,
          }}
        >
          {!editing && (
            <>
              <span
                className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-medium tabular-nums px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor:
                    headerFg === "#ffffff" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.12)",
                  color: headerFg,
                }}
              >
                {deals.length}
              </span>
              <h3 className="text-[11px] font-medium text-center truncate max-w-[70%] px-1 leading-tight">
                {stage.label}
              </h3>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-black/10 transition-colors"
                title="Редактировать название и цвет"
              >
                <Pencil size={11} />
              </button>
            </>
          )}
          {editing && (
            <span className="text-[11px] font-medium truncate px-7 py-1.5 opacity-90">
              {draftLabel || stage.label}
            </span>
          )}
        </div>

        <div className="px-3 pt-2 pb-1.5 text-center">
          <p className="text-base text-gray-800 tracking-tight tabular-nums font-normal inline-block">
            {formatCurrency(totalValue)}
          </p>
        </div>

        <div className="px-3 pb-2 flex justify-center">
          <button
            type="button"
            onClick={() => onAddDeal?.(stage.id)}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-brand-600 hover:bg-brand-50/80 transition-colors"
            title="Добавить сделку"
          >
            <Plus size={22} strokeWidth={2} />
          </button>
        </div>

        <div
          ref={setNodeRef}
          className="flex-1 overflow-y-auto px-2 pb-2 space-y-2.5 min-h-[60px]"
        >
          <SortableContext
            items={deals.map((d) => d.id)}
            strategy={verticalListSortingStrategy}
          >
            {deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onContactClick={onContactClick}
                onDealClick={onDealClick}
              />
            ))}
          </SortableContext>

          {deals.length === 0 && (
            <div className="flex items-center justify-center h-16 text-xs text-gray-300">
              Перетащите сделку сюда
            </div>
          )}
        </div>
      </div>

      {editing &&
        panelPos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[100] w-72 rounded-xl border border-gray-200 bg-white shadow-2xl p-4"
            style={{ top: panelPos.top, left: panelPos.left }}
          >
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Название стадии
            </p>
            <input
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              className="w-full text-sm font-medium rounded-lg px-3 py-2 border border-gray-200 text-gray-900 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-400"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") cancelEdit();
              }}
            />
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Цвет
            </p>
            <div className="flex flex-col gap-3">
              <div className="w-full rounded-lg overflow-hidden [&_.react-colorful]:w-full [&_.react-colorful]:h-40">
                <HexColorPicker color={pickerColor} onChange={setDraftColor} />
              </div>
              <input
                type="text"
                value={draftColor}
                onChange={(e) => setDraftColor(e.target.value)}
                className="w-full text-xs font-mono rounded-lg px-2 py-1.5 border border-gray-200"
                placeholder="#6366F1"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
              >
                <X size={14} /> Отмена
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600"
              >
                <Check size={14} /> Готово
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
