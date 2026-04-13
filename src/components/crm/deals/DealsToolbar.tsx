"use client";

import { useRef, useEffect, useState } from "react";
import { Search, LayoutGrid, List, X, ChevronDown, UserCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrgMember } from "@/app/actions/deals";

export type ViewMode = "kanban" | "list";

interface DealsToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterAssigneeId: string | null;
  onFilterAssigneeId: (id: string | null) => void;
  orgMembers: OrgMember[];
}

export default function DealsToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filterAssigneeId,
  onFilterAssigneeId,
  orgMembers,
}: DealsToolbarProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const activeAssignee = orgMembers.find((m) => m.id === filterAssigneeId) ?? null;
  const hasFilters = !!filterAssigneeId || !!searchQuery;

  return (
    <div className="flex shrink-0 items-center gap-3 px-6 py-3">
      {/* Search + filter panel */}
      <div ref={wrapRef} className="relative flex-1">
        {/* Search input */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setPanelOpen(true)}
            placeholder="Поиск по названию, компании, контакту…"
            className={cn(
              "w-full rounded-lg border bg-white py-2 pl-9 pr-8 text-sm text-gray-900 placeholder-gray-400 transition focus:outline-none focus:ring-1",
              panelOpen || hasFilters
                ? "border-brand-400 ring-1 ring-brand-400 rounded-b-none border-b-transparent"
                : "border-gray-200 focus:border-brand-400 focus:ring-brand-400"
            )}
          />
          {(searchQuery || filterAssigneeId) && (
            <button
              type="button"
              onClick={() => { onSearchChange(""); onFilterAssigneeId(null); setPanelOpen(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-500"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Drop-down filter panel */}
        {panelOpen && (
          <div className="absolute left-0 right-0 top-full z-50 bg-white border border-brand-400 border-t-gray-100 rounded-b-xl shadow-xl overflow-hidden">
            {/* Active filter chips */}
            {activeAssignee && (
              <div className="px-4 pt-3 pb-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onFilterAssigneeId(null)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-xs font-medium text-brand-700 hover:bg-brand-100 transition-colors"
                >
                  <UserCircle size={12} />
                  {activeAssignee.name}
                  <X size={11} className="opacity-60" />
                </button>
              </div>
            )}

            {/* Assignee filter section */}
            <div className="px-4 py-3">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Ответственный
              </p>
              <div className="grid grid-cols-2 gap-1 max-h-52 overflow-y-auto">
                {orgMembers.length === 0 && (
                  <p className="col-span-2 text-xs text-gray-400 italic py-2">Нет сотрудников</p>
                )}
                {orgMembers.map((m) => {
                  const active = filterAssigneeId === m.id;
                  const initials = m.name
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0]?.toUpperCase() ?? "")
                    .join("");
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onFilterAssigneeId(active ? null : m.id);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left transition-colors",
                        active
                          ? "bg-brand-50 text-brand-700 font-medium ring-1 ring-brand-200"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold shrink-0",
                          active ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {active ? <Check size={13} /> : initials}
                      </span>
                      <span className="truncate">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            {hasFilters && (
              <div className="px-4 py-2 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => { onSearchChange(""); onFilterAssigneeId(null); setPanelOpen(false); }}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Сбросить все фильтры
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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
