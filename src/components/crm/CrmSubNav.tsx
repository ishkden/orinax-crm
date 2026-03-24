"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Briefcase, Users, Building2, UserCheck } from "lucide-react";
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

export default function CrmSubNav() {
  const pathname = usePathname();
  const [tabs, setTabs] = useState<Tab[]>(DEFAULT_TABS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const savedIds: string[] = JSON.parse(saved);
        const reordered = savedIds
          .map((id) => DEFAULT_TABS.find((t) => t.id === id))
          .filter(Boolean) as Tab[];
        const missing = DEFAULT_TABS.filter(
          (t) => !savedIds.includes(t.id)
        );
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

  if (!mounted) {
    return (
      <div className="bg-white border-b border-gray-100 px-6 shrink-0">
        <div className="flex items-center gap-1">
          {DEFAULT_TABS.map((tab) => {
            const Icon = ICON_MAP[tab.icon as keyof typeof ICON_MAP];
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150",
                  isActive ? "text-brand-600" : "text-gray-500 hover:text-gray-800"
                )}
              >
                <Icon size={15} className={cn("shrink-0", isActive ? "text-brand-500" : "text-gray-400")} />
                {tab.label}
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full" />}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-100 px-6 shrink-0">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tabs.map((t) => t.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive =
                pathname === tab.href || pathname.startsWith(tab.href + "/");
              return <SortableTab key={tab.id} tab={tab} isActive={isActive} />;
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
