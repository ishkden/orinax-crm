"use client";

import { useState, useEffect, useRef, useLayoutEffect, useCallback, useTransition } from "react";
import { createPortal } from "react-dom";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Pencil, Check, X, Trash2 } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { cn, formatCurrency, contrastTextOnHex } from "@/lib/utils";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import DealCard from "./DealCard";
import { useKanbanStyles } from "./KanbanStyleContext";
import type { Deal, Stage } from "./types";

interface KanbanColumnProps {
  stage: Stage;
  deals: Deal[];
  committedStageTotal: number;
  currencyForTotal?: string;
  onAddDeal?: (stageId: string) => void;
  onStageUpdate?: (stageId: string, updates: { label?: string; color?: string }) => void;
  onStageDelete?: (stageId: string) => void;
  onContactClick?: (deal: Deal) => void;
  onDealClick?: (deal: Deal) => void;
}

export default function KanbanColumn({
  stage,
  deals,
  committedStageTotal,
  currencyForTotal = "RUB",
  onAddDeal,
  onStageUpdate,
  onStageDelete,
  onContactClick,
  onDealClick,
}: KanbanColumnProps) {
  const s = useKanbanStyles();
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(stage.label);
  const [draftColor, setDraftColor] = useState(stage.color);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startDeleteTransition] = useTransition();

  const showToast = useCallback(() => {
    setToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(false), 3000);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);
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
    setConfirmDelete(false);
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

  const formatStageTotal = useCallback(
    (n: number) => formatCurrency(n, currencyForTotal),
    [currencyForTotal]
  );

  return (
    <div
      className="flex h-full min-h-0 shrink-0 flex-col self-stretch"
      style={{ width: s.column.width, minWidth: s.column.width }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden border transition-colors duration-150"
        style={{
          borderRadius: s.column.borderRadius,
          backgroundColor: isOver ? s.column.dragOverBgColor : s.column.backgroundColor,
          borderColor: isOver ? s.column.dragOverBorderColor : "transparent",
          opacity: s.column.backgroundOpacity / 100,
        }}
      >
        <div
          ref={headerRef}
          className="relative flex items-center justify-center"
          style={{
            backgroundColor: headerBg,
            color: headerFg,
            minHeight: s.columnHeader.minHeight,
            padding: `${s.columnHeader.paddingY}px ${s.columnHeader.paddingX}px`,
            borderTopLeftRadius: s.columnHeader.borderRadius,
            borderTopRightRadius: s.columnHeader.borderRadius,
          }}
        >
          {!editing && (
            <>
              <span
                className="absolute left-1.5 top-1/2 -translate-y-1/2 font-medium tabular-nums rounded-full"
                style={{
                  fontSize: s.columnHeader.countBadgeFontSize,
                  padding: `${s.columnHeader.countBadgePaddingY}px ${s.columnHeader.countBadgePaddingX}px`,
                  backgroundColor:
                    headerFg === "#ffffff" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.12)",
                  color: headerFg,
                }}
              >
                {deals.length}
              </span>
              <h3
                className="text-center truncate max-w-[70%] px-1 leading-tight"
                style={{
                  fontSize: s.columnHeader.fontSize,
                  fontWeight: s.columnHeader.fontWeight,
                }}
              >
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
            <span
              className="truncate px-7 py-1.5 opacity-90"
              style={{
                fontSize: s.columnHeader.fontSize,
                fontWeight: s.columnHeader.fontWeight,
              }}
            >
              {draftLabel || stage.label}
            </span>
          )}
        </div>

        {s.stageTotal.show && (
          <div className="flex flex-col items-center px-3 pb-1 pt-2 text-center">
            <AnimatedCounter
              value={committedStageTotal}
              duration={0.38}
              className="inline-block tabular-nums tracking-tight"
              style={{
                fontSize: s.stageTotal.fontSize,
                fontWeight: s.stageTotal.fontWeight,
                color: s.stageTotal.textColor,
              }}
              formatValue={formatStageTotal}
            />
          </div>
        )}

        {s.addButton.show && (
          <div className="flex justify-center px-3 pb-2">
            <button
              type="button"
              onClick={() => onAddDeal?.(stage.id)}
              className="flex items-center justify-center text-gray-500 transition-colors hover:bg-brand-50/80 hover:text-brand-600"
              style={{
                width: s.addButton.size,
                height: s.addButton.size,
                borderRadius: s.addButton.borderRadius,
              }}
              title="Добавить сделку"
            >
              <Plus size={s.addButton.iconSize} strokeWidth={2} />
            </button>
          </div>
        )}

        <div
          ref={setNodeRef}
          className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-2 pb-2 [-webkit-overflow-scrolling:touch]"
          style={{ gap: s.column.cardGap }}
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
              style={{
                fontSize: s.emptyState.fontSize,
                color: s.emptyState.textColor,
              }}
            >
              {s.emptyState.text}
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

            {onStageDelete && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (deals.length > 0) {
                        showToast();
                      } else {
                        setConfirmDelete(true);
                      }
                    }}
                    className="inline-flex w-full items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} /> Удалить стадию
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-center text-gray-500">
                      Удалить стадию{" "}
                      <span className="font-medium text-gray-800">&quot;{stage.label}&quot;</span>?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        Нет
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          startDeleteTransition(() => {
                            onStageDelete(stage.id);
                          });
                          setEditing(false);
                          setConfirmDelete(false);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={13} /> Удалить
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>,
          document.body
        )}

      {toast &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={cn(
              "fixed bottom-6 left-1/2 -translate-x-1/2 z-[200]",
              "flex items-center gap-2 rounded-xl px-4 py-2.5",
              "bg-gray-900/90 text-white text-sm shadow-xl backdrop-blur-sm",
              "animate-in fade-in slide-in-from-bottom-2 duration-200"
            )}
          >
            <X size={14} className="shrink-0 text-red-400" />
            Пока есть сделки в стадии, стадию удалить нельзя
          </div>,
          document.body
        )}
    </div>
  );
}
