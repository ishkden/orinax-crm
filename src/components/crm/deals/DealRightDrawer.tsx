"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  X,
  Banknote,
  Calendar,
  CheckSquare,
  Activity,
  MessageSquare,
  AlignLeft,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Deal, Stage } from "./types";
import ContactInfoBlock from "./ContactInfoBlock";
import ActivityFeed from "./ActivityFeed";
import TaskList from "./TaskList";
import ChatPanel from "./ChatPanel";
import { CRM_RIGHT_BAR_W } from "@/components/crm/crmChrome";
import { useSidebar } from "@/components/layout/SidebarContext";

interface DealRightDrawerProps {
  deal: Deal | null;
  stages: Stage[];
  onClose: () => void;
}

type TabId = "details" | "tasks" | "activity" | "chat";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "details", label: "Детали", icon: <AlignLeft size={14} /> },
  { id: "tasks", label: "Задачи", icon: <CheckSquare size={14} /> },
  { id: "activity", label: "Активность", icon: <Activity size={14} /> },
  { id: "chat", label: "Чат", icon: <MessageSquare size={14} /> },
];

const STAGE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  LEAD:        { bg: "bg-gray-100",    text: "text-gray-700",    dot: "bg-gray-400"    },
  QUALIFIED:   { bg: "bg-indigo-100",  text: "text-indigo-700",  dot: "bg-indigo-500"  },
  PROPOSAL:    { bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500"  },
  NEGOTIATION: { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500"   },
  CLOSED_WON:  { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  CLOSED_LOST: { bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500"     },
};

function StageBadge({ stage, stages }: { stage: string; stages: Stage[] }) {
  const label = stages.find((s) => s.id === stage)?.label ?? stage;
  const colors = STAGE_COLORS[stage] ?? {
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
      {label}
    </span>
  );
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
      <span className="text-3xl opacity-30">🚧</span>
      <p className="text-sm">{label} в разработке</p>
    </div>
  );
}

function DetailsTab({ deal, stages }: { deal: Deal; stages: Stage[] }) {
  return (
    <div className="space-y-4 pb-6">
      <div className="mx-5 rounded-xl border border-gray-100 bg-gray-50/60 divide-y divide-gray-100 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Banknote size={15} strokeWidth={1.75} className="text-gray-400 shrink-0" />
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-0.5">
              Сумма
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(deal.value, deal.currency)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Calendar size={15} strokeWidth={1.75} className="text-gray-400 shrink-0" />
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-0.5">
              Срок закрытия
            </p>
            <p className="text-sm text-gray-900">
              {deal.dueDate ? formatDate(deal.dueDate) : "—"}
            </p>
          </div>
        </div>
      </div>

      {deal.description && (
        <div className="mx-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
            Описание
          </p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {deal.description}
          </p>
        </div>
      )}

      {deal.tags.length > 0 && (
        <div className="mx-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
            Теги
          </p>
          <div className="flex flex-wrap gap-1.5">
            {deal.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-brand-50 text-brand-700 text-xs rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DealRightDrawer({ deal, stages, onClose }: DealRightDrawerProps) {
  const open = deal !== null;
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const { widthPx: sidebarWidth } = useSidebar();

  useEffect(() => {
    if (!open) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) setActiveTab("details");
  }, [open]);

  return (
    <AnimatePresence>
      {deal && (
        <>
          {/* Backdrop — covers only the main content area */}
          <motion.div
            className="fixed top-0 bottom-0 z-[80] bg-black/40"
            style={{ left: sidebarWidth, right: CRM_RIGHT_BAR_W }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            key="deal-right-drawer"
            role="dialog"
            aria-modal="true"
            className="fixed top-0 bottom-0 z-[90] w-[500px] bg-white shadow-2xl flex flex-col overflow-hidden"
            style={{ right: CRM_RIGHT_BAR_W }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
          >
            {/* ── Header ── */}
            <div className="shrink-0 border-b border-gray-100 px-5 pt-5 pb-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="text-lg font-semibold text-gray-900 leading-tight line-clamp-2">
                  {deal.title}
                </h2>
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  <Link
                    href={`/crm/deals/${deal.serialNumber}`}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-gray-100 transition-colors"
                    title="Открыть полностью"
                  >
                    <ExternalLink size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <StageBadge stage={deal.stage} stages={stages} />
                <span className="text-sm font-semibold text-gray-700">
                  {formatCurrency(deal.value, deal.currency)}
                </span>
                {deal.assignee && (
                  <span className="text-xs text-gray-400">· {deal.assignee}</span>
                )}
              </div>
            </div>

            {/* ── Contact info ── */}
            <div className="shrink-0 py-3">
              <ContactInfoBlock deal={deal} />
            </div>

            {/* ── Tabs nav ── */}
            <div className="shrink-0 flex border-b border-gray-100 px-5 gap-0.5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-brand-600 text-brand-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Tab content ── */}
            <div
              className={`flex-1 ${
                activeTab === "chat"
                  ? "overflow-hidden"
                  : "overflow-y-auto pt-4"
              }`}
            >
              {activeTab === "details" && <DetailsTab deal={deal} stages={stages} />}
              {activeTab === "tasks" && <TaskList dealId={deal.id} />}
              {activeTab === "activity" && <ActivityFeed dealId={deal.id} />}
              {activeTab === "chat" && <ChatPanel dealId={deal.id} />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
