"use client";

import { useState, useRef, useEffect } from "react";
import { Search, LayoutGrid, List, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Deal } from "./mockData";
import { assignees, priorities } from "./mockData";

export type ViewMode = "kanban" | "list";

interface DealsToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterAssignee: string | null;
  onFilterAssignee: (a: string | null) => void;
  filterPriority: Deal["priority"] | null;
  onFilterPriority: (p: Deal["priority"] | null) => void;
  totalDeals: number;
}

export default function DealsToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filterAssignee,
  onFilterAssignee,
  filterPriority,
  onFilterPriority,
  totalDeals,
}: DealsToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const hasFilters = filterAssignee || filterPriority;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="flex shrink-0 flex-col gap-3 px-6 py-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">
          {totalDeals} {totalDeals === 1 ? "сделка" : "сделок"}
        </span>

        <div className="flex-1" />

        <div ref={searchRef} className="relative z-40">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
              searchOpen || searchQuery || hasFilters
                ? "border-brand-300 bg-brand-50/40 text-brand-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            )}
          >
            <Search size={16} className="shrink-0 text-gray-400" />
            <span>Поиск</span>
            {(searchQuery || hasFilters) && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            )}
          </button>

          {searchOpen && (
            <div className="absolute top-full right-0 mt-2 w-[min(100vw-2rem,22rem)] bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Название, компания, контакт…"
                    className="w-full pl-9 pr-8 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50/80 placeholder-gray-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => onSearchChange("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 p-1"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 space-y-4 max-h-[min(60vh,320px)] overflow-y-auto">
                <div>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Ответственный
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => onFilterAssignee(null)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                        !filterAssignee
                          ? "bg-brand-100 text-brand-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      Все
                    </button>
                    {assignees.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => onFilterAssignee(a)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium transition-colors max-w-full truncate",
                          filterAssignee === a
                            ? "bg-brand-100 text-brand-700"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Приоритет
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => onFilterPriority(null)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                        !filterPriority
                          ? "bg-brand-100 text-brand-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      Все
                    </button>
                    {priorities.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => onFilterPriority(p.value)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                          filterPriority === p.value
                            ? "bg-brand-100 text-brand-700"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      onFilterAssignee(null);
                      onFilterPriority(null);
                    }}
                    className="w-full text-center text-xs text-red-500 hover:text-red-600 py-1"
                  >
                    Сбросить фильтры
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange("kanban")}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150",
              viewMode === "kanban"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            )}
            title="Канбан"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150",
              viewMode === "list"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            )}
            title="Список"
          >
            <List size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
