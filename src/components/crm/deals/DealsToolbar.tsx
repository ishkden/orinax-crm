"use client";

import { useRef, useEffect } from "react";
import { Search, LayoutGrid, List, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { Deal } from "./types";

export type ViewMode = "kanban" | "list";

interface DealsToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterAssignee: string | null;
  onFilterAssignee: (a: string | null) => void;
  assignees: string[];
}

export default function DealsToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filterAssignee,
  onFilterAssignee,
  assignees,
}: DealsToolbarProps) {
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const assigneeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) {
        setAssigneeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="flex shrink-0 items-center gap-3 px-6 py-3">
      {/* Search input — always visible, fills available space */}
      <div className="relative flex-1">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Поиск по названию, компании, контакту…"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm text-gray-900 placeholder-gray-400 transition focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-500"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Assignee filter */}
      {assignees.length > 0 && (
        <div ref={assigneeRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setAssigneeOpen((v) => !v)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              filterAssignee
                ? "border-brand-300 bg-brand-50/40 text-brand-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            )}
          >
            {filterAssignee ? (
              <span className="max-w-[120px] truncate">{filterAssignee}</span>
            ) : (
              <span>Ответственный</span>
            )}
            <ChevronDown size={14} className={cn("text-gray-400 transition-transform", assigneeOpen && "rotate-180")} />
          </button>

          {assigneeOpen && (
            <div className="absolute top-full right-0 mt-2 min-w-[180px] bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden py-1">
              <button
                type="button"
                onClick={() => { onFilterAssignee(null); setAssigneeOpen(false); }}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm transition-colors",
                  !filterAssignee ? "text-brand-700 font-medium bg-brand-50/50" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                Все
              </button>
              {assignees.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => { onFilterAssignee(a); setAssigneeOpen(false); }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm truncate transition-colors",
                    filterAssignee === a ? "text-brand-700 font-medium bg-brand-50/50" : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View mode toggle */}
      <div className="flex shrink-0 items-center rounded-lg bg-gray-100 p-0.5">
        <button
          type="button"
          onClick={() => onViewModeChange("kanban")}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md transition-all duration-150",
            viewMode === "kanban" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
          )}
          title="Канбан"
        >
          <LayoutGrid size={15} />
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange("list")}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md transition-all duration-150",
            viewMode === "list" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
          )}
          title="Список"
        >
          <List size={15} />
        </button>
      </div>
    </div>
  );
}
