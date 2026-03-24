"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  Plus,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Pipeline, Deal } from "./mockData";
import { assignees, priorities } from "./mockData";

export type ViewMode = "kanban" | "list";

interface DealsToolbarProps {
  pipelines: Pipeline[];
  activePipelineId: string;
  onPipelineChange: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onCreateDeal: () => void;
  filterAssignee: string | null;
  onFilterAssignee: (a: string | null) => void;
  filterPriority: Deal["priority"] | null;
  onFilterPriority: (p: Deal["priority"] | null) => void;
  totalDeals: number;
}

export default function DealsToolbar({
  pipelines,
  activePipelineId,
  onPipelineChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onCreateDeal,
  filterAssignee,
  onFilterAssignee,
  filterPriority,
  onFilterPriority,
  totalDeals,
}: DealsToolbarProps) {
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const pipelineRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  const activePipeline = pipelines.find((p) => p.id === activePipelineId);
  const hasFilters = filterAssignee || filterPriority;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pipelineRef.current && !pipelineRef.current.contains(e.target as Node)) {
        setPipelineOpen(false);
      }
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="px-6 py-3 flex flex-col gap-3">
      {/* Row 1: Pipeline + actions */}
      <div className="flex items-center gap-3">
        {/* Pipeline selector */}
        <div ref={pipelineRef} className="relative">
          <button
            onClick={() => setPipelineOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-800 hover:border-gray-300 transition-colors"
          >
            <span>{activePipeline?.label ?? "Воронка"}</span>
            <ChevronDown
              size={14}
              className={cn(
                "text-gray-400 transition-transform",
                pipelineOpen && "rotate-180"
              )}
            />
          </button>

          {pipelineOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1">
              {pipelines.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onPipelineChange(p.id);
                    setPipelineOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors",
                    p.id === activePipelineId
                      ? "text-brand-600 font-medium bg-brand-50/50"
                      : "text-gray-700"
                  )}
                >
                  {p.label}
                  <span className="ml-2 text-xs text-gray-400">
                    {p.stages.length} этапов
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-xs text-gray-400">
          {totalDeals} {totalDeals === 1 ? "сделка" : "сделок"}
        </span>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по сделкам..."
            className="pl-9 pr-3 py-2 w-64 text-sm rounded-lg border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters toggle */}
        <div ref={filtersRef} className="relative">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors",
              hasFilters
                ? "border-brand-300 bg-brand-50 text-brand-600"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            )}
          >
            <SlidersHorizontal size={14} />
            Фильтры
            {hasFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            )}
          </button>

          {filtersOpen && (
            <div className="absolute top-full right-0 mt-1 w-72 bg-white rounded-lg border border-gray-200 shadow-lg z-50 p-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ответственный
                </label>
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => onFilterAssignee(null)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                      !filterAssignee ? "bg-brand-50 text-brand-600" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    Все
                  </button>
                  {assignees.map((a) => (
                    <button
                      key={a}
                      onClick={() => onFilterAssignee(a)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                        filterAssignee === a ? "bg-brand-50 text-brand-600" : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Приоритет
                </label>
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => onFilterPriority(null)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                      !filterPriority ? "bg-brand-50 text-brand-600" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    Все
                  </button>
                  {priorities.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => onFilterPriority(p.value)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors",
                        filterPriority === p.value ? "bg-brand-50 text-brand-600" : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={() => {
                    onFilterAssignee(null);
                    onFilterPriority(null);
                  }}
                  className="w-full text-center text-xs text-red-500 hover:text-red-600 pt-2 border-t border-gray-100"
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
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

        {/* Create deal */}
        <button
          onClick={onCreateDeal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Создать сделку
        </button>
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Фильтры:</span>
          {filterAssignee && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-brand-50 text-brand-600 text-xs font-medium">
              {filterAssignee}
              <button
                onClick={() => onFilterAssignee(null)}
                className="hover:text-brand-800"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filterPriority && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-brand-50 text-brand-600 text-xs font-medium">
              {priorities.find((p) => p.value === filterPriority)?.label}
              <button
                onClick={() => onFilterPriority(null)}
                className="hover:text-brand-800"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
