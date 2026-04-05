"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Briefcase, Users, Building2, UserCheck, ChevronDown } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCrmDealPipeline } from "./CrmDealPipelineContext";
import { useKanbanStyles } from "@/components/crm/deals/KanbanStyleContext";

const DEFAULT_TABS = [
  { id: "deals", href: "/crm/deals", label: "Сделки", icon: "Briefcase" },
  { id: "contacts", href: "/crm/contacts", label: "Контакты", icon: "Users" },
  { id: "companies", href: "/crm/companies", label: "Компании", icon: "Building2" },
  { id: "leads", href: "/crm/leads", label: "Лиды", icon: "UserCheck" },
];

const ICON_MAP = { Briefcase, Users, Building2, UserCheck };
const STORAGE_KEY = "crm-tabs-order";

type Tab = (typeof DEFAULT_TABS)[number];

function SortableTab({ tab, isActive }: { tab: Tab; isActive: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const Icon = ICON_MAP[tab.icon as keyof typeof ICON_MAP];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative", isDragging && "z-50 opacity-80")}
    >
      <Link
        href={tab.href}
        className={cn(
          "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150 select-none",
          isActive ? "text-brand-600" : "text-gray-500 hover:text-gray-800",
          isDragging && "pointer-events-none"
        )}
        {...attributes}
        {...listeners}
      >
        <Icon
          size={15}
          className={cn(
            "shrink-0",
            isActive ? "text-brand-500" : "text-gray-400"
          )}
        />
        {tab.label}
        {isActive && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full" />
        )}
      </Link>
    </div>
  );
}

function PipelineInTabsRow() {
  const pathname = usePathname();
  const { pipeline } = useCrmDealPipeline();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (!pathname.startsWith("/crm/deals") || !pipeline) return null;

  const active = pipeline.pipelines.find((p) => p.id === pipeline.activePipelineId);

  return (
    <div ref={ref} className="relative flex items-center justify-center min-h-[48px] px-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 hover:border-gray-300 transition-colors max-w-full"
      >
        <span className="truncate">{active?.label ?? "Воронка"}</span>
        <ChevronDown
          size={14}
          className={cn("text-gray-400 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-56 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1">
          {pipeline.pipelines.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                pipeline.onPipelineChange(p.id);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors",
                p.id === pipeline.activePipelineId
                  ? "text-brand-600 font-medium bg-brand-50/50"
                  : "text-gray-700"
              )}
            >
              {p.label}
              <span className="ml-2 text-xs text-gray-400">{p.stages.length} этапов</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CrmSubNav() {
  const pathname = usePathname();
  const [tabs, setTabs] = useState<Tab[]>(DEFAULT_TABS);
  const [mounted, setMounted] = useState(false);
  const { layout } = useKanbanStyles();
  const navHeight = layout.subNavHeight;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const savedIds: string[] = JSON.parse(saved);
        const reordered = savedIds
          .map((id) => DEFAULT_TABS.find((t) => t.id === id))
          .filter(Boolean) as Tab[];
        const missing = DEFAULT_TABS.filter((t) => !savedIds.includes(t.id));
        setTabs([...reordered, ...missing]);
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setTabs((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === active.id);
      const newIndex = prev.findIndex((t) => t.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next.map((t) => t.id)));
      return next;
    });
  }

  const tabsRow = (tabList: Tab[]) => (
    <div className="flex items-center gap-1 shrink-0">
      {tabList.map((tab) => {
        const isActive =
          pathname === tab.href || pathname.startsWith(tab.href + "/");
        return <SortableTab key={tab.id} tab={tab} isActive={isActive} />;
      })}
    </div>
  );

  if (!mounted) {
    return (
      <div className="bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-stretch" style={{ minHeight: navHeight }}>
          <div className="flex items-center gap-1 px-6 shrink-0">
            {DEFAULT_TABS.map((tab) => {
              const Icon = ICON_MAP[tab.icon as keyof typeof ICON_MAP];
              const isActive =
                pathname === tab.href || pathname.startsWith(tab.href + "/");
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150",
                    isActive ? "text-brand-600" : "text-gray-500 hover:text-gray-800"
                  )}
                >
                  <Icon
                    size={15}
                    className={cn(
                      "shrink-0",
                      isActive ? "text-brand-500" : "text-gray-400"
                    )}
                  />
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full" />
                  )}
                </Link>
              );
            })}
          </div>
          <div className="flex-1 flex items-center justify-center px-4 min-w-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-100 shrink-0">
      <div className="flex items-stretch" style={{ minHeight: navHeight }}>
        <div className="flex items-center px-6 shrink-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tabs.map((t) => t.id)}
              strategy={horizontalListSortingStrategy}
            >
              {tabsRow(tabs)}
            </SortableContext>
          </DndContext>
        </div>

        <div className="flex-1 flex items-center justify-center min-w-0">
          <PipelineInTabsRow />
        </div>
      </div>
    </div>
  );
}
