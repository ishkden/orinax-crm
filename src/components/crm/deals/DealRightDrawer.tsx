"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Banknote,
  Calendar,
  CheckSquare,
  Activity,
  MessageSquare,
  AlignLeft,
  Pencil,
  Check,
  SlidersHorizontal,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Deal, Stage } from "./types";
import type { CustomFieldDef, CustomFieldType } from "@/app/actions/custom-fields";
import { saveDealCustomFieldValues } from "@/app/actions/custom-fields";
import ContactInfoBlock from "./ContactInfoBlock";
import ActivityFeed from "./ActivityFeed";
import TaskList from "./TaskList";
import ChatPanel from "./ChatPanel";
import { CRM_RIGHT_BAR_W } from "@/components/crm/crmChrome";
import { useSidebar } from "@/components/layout/SidebarContext";

interface DealRightDrawerProps {
  deal: Deal | null;
  stages: Stage[];
  customFields?: CustomFieldDef[];
  onClose: () => void;
  onDealUpdate?: (deal: Deal) => void;
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
  const colors = STAGE_COLORS[stage] ?? { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
      {label}
    </span>
  );
}

// ─── Custom field value display/edit ─────────────────────────────────────────

function formatFieldValue(value: unknown, type: CustomFieldType): string {
  if (value === null || value === undefined || value === "") return "—";
  switch (type) {
    case "BOOLEAN": return value ? "Да" : "Нет";
    case "DATE": return value ? formatDate(value as string) : "—";
    case "DATETIME": return value ? new Date(value as string).toLocaleString("ru-RU") : "—";
    case "MONEY": {
      const m = value as { amount?: number; currency?: string };
      if (!m || m.amount === undefined) return "—";
      return formatCurrency(m.amount, m.currency ?? "RUB");
    }
    case "LIST": {
      const arr = Array.isArray(value) ? value : [value];
      return arr.filter(Boolean).join(", ") || "—";
    }
    default: return String(value) || "—";
  }
}

function CustomFieldInput({
  field,
  value,
  onChange,
}: {
  field: CustomFieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const cls = "w-full rounded-lg border border-brand-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

  switch (field.type) {
    case "STRING":
    case "ADDRESS":
    case "URL":
      return (
        <input
          autoFocus
          type={field.type === "URL" ? "url" : "text"}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
          placeholder={field.type === "URL" ? "https://" : ""}
        />
      );
    case "TEXT":
      return (
        <textarea
          autoFocus
          rows={3}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={cls + " resize-none"}
        />
      );
    case "NUMBER":
      return (
        <input
          autoFocus
          type="number"
          value={(value as number) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className={cls}
        />
      );
    case "BOOLEAN": {
      const checked = Boolean(value);
      return (
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-brand-600" : "bg-gray-200"}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
        </button>
      );
    }
    case "DATE":
      return (
        <input
          autoFocus
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      );
    case "DATETIME":
      return (
        <input
          autoFocus
          type="datetime-local"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      );
    case "MONEY": {
      const m = (value as { amount?: number; currency?: string }) ?? {};
      return (
        <div className="flex gap-1">
          <input
            autoFocus
            type="number"
            value={m.amount ?? ""}
            onChange={(e) => onChange({ ...m, amount: e.target.value === "" ? null : Number(e.target.value) })}
            placeholder="0"
            className={cls + " flex-1"}
          />
          <select
            value={m.currency ?? "RUB"}
            onChange={(e) => onChange({ ...m, currency: e.target.value })}
            className="rounded-lg border border-brand-300 bg-white px-2 py-1.5 text-sm outline-none"
          >
            {["RUB", "USD", "EUR", "KZT", "BYN"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      );
    }
    case "LIST": {
      const options = field.options ?? [];
      const selectedArr = Array.isArray(value) ? (value as string[]) : value ? [value as string] : [];
      function toggle(opt: string) {
        const next = selectedArr.includes(opt)
          ? selectedArr.filter((x) => x !== opt)
          : [...selectedArr, opt];
        onChange(next.length === 0 ? null : next);
      }
      return (
        <div className="flex flex-wrap gap-1.5">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                selectedArr.includes(opt)
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }
    case "RESOURCE": {
      const r = (value as { from?: string; to?: string }) ?? {};
      return (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            type="datetime-local"
            value={r.from ?? ""}
            onChange={(e) => onChange({ ...r, from: e.target.value })}
            className={cls + " flex-1"}
          />
          <span className="text-xs text-gray-400">—</span>
          <input
            type="datetime-local"
            value={r.to ?? ""}
            onChange={(e) => onChange({ ...r, to: e.target.value })}
            className={cls + " flex-1"}
          />
        </div>
      );
    }
    case "FILE":
      return (
        <input
          autoFocus
          type="url"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL файла или изображения"
          className={cls}
        />
      );
    default:
      return (
        <input
          autoFocus
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      );
  }
}

function CustomFieldRow({
  field,
  value,
  onSave,
}: {
  field: CustomFieldDef;
  value: unknown;
  onSave: (code: string, v: unknown) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<unknown>(value);
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setDraft(value);
    setEditing(true);
  }

  async function commit() {
    setSaving(true);
    setEditing(false);
    await onSave(field.code, draft);
    setSaving(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  const displayValue = formatFieldValue(value, field.type);
  const isEmpty = displayValue === "—";
  const isBool = field.type === "BOOLEAN";

  if (isBool) {
    return (
      <div className="flex items-center gap-3 py-2 px-0 group">
        <p className="text-xs text-gray-500 w-36 shrink-0">{field.name}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSave(field.code, !value)}
            className={`relative w-9 h-5 rounded-full transition-colors ${value ? "bg-brand-600" : "bg-gray-200"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : ""}`} />
          </button>
          <span className="text-xs text-gray-500">{value ? "Да" : "Нет"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 py-2 group">
      <p className="text-xs text-gray-500 w-36 shrink-0 pt-1.5">{field.name}</p>
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex flex-col gap-1.5">
            <CustomFieldInput field={field} value={draft} onChange={setDraft} />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={commit}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-600 text-white text-xs hover:bg-brand-700 transition-colors"
              >
                <Check size={11} /> Сохранить
              </button>
              <button
                type="button"
                onClick={cancel}
                className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className={`text-left w-full group/val flex items-center gap-1.5 ${saving ? "opacity-50" : ""}`}
          >
            <span className={`text-sm leading-relaxed ${isEmpty ? "text-gray-300 italic" : "text-gray-900"}`}>
              {saving ? "Сохранение..." : displayValue}
            </span>
            <Pencil size={11} className="text-gray-300 opacity-0 group-hover/val:opacity-100 transition-opacity shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Details Tab ──────────────────────────────────────────────────────────────

function DetailsTab({
  deal,
  stages,
  customFields,
  onFieldSave,
}: {
  deal: Deal;
  stages: Stage[];
  customFields: CustomFieldDef[];
  onFieldSave: (code: string, value: unknown) => Promise<void>;
}) {
  return (
    <div className="space-y-5 pb-8">
      {/* Standard deal fields */}
      <div className="mx-5 rounded-xl border border-gray-100 bg-gray-50/60 divide-y divide-gray-100 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Banknote size={15} strokeWidth={1.75} className="text-gray-400 shrink-0" />
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-0.5">Сумма</p>
            <p className="text-sm font-semibold text-gray-900">{formatCurrency(deal.value, deal.currency)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Calendar size={15} strokeWidth={1.75} className="text-gray-400 shrink-0" />
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-0.5">Срок закрытия</p>
            <p className="text-sm text-gray-900">{deal.dueDate ? formatDate(deal.dueDate) : "—"}</p>
          </div>
        </div>
      </div>

      {deal.description && (
        <div className="mx-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Описание</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{deal.description}</p>
        </div>
      )}

      {deal.tags.length > 0 && (
        <div className="mx-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Теги</p>
          <div className="flex flex-wrap gap-1.5">
            {deal.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-brand-50 text-brand-700 text-xs rounded-md">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Custom fields */}
      {customFields.length > 0 && (
        <div className="mx-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Пользовательские поля</p>
            <Link
              href="/crm/settings/custom-fields"
              className="flex items-center gap-1 text-[10px] text-gray-300 hover:text-brand-500 transition-colors"
              title="Настроить поля"
            >
              <SlidersHorizontal size={10} />
              Настроить
            </Link>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white px-4 divide-y divide-gray-50">
            {customFields.map((f) => (
              <CustomFieldRow
                key={f.id}
                field={f}
                value={deal.customFieldValues?.[f.code] ?? null}
                onSave={onFieldSave}
              />
            ))}
          </div>
        </div>
      )}

      {customFields.length === 0 && (
        <div className="mx-5">
          <Link
            href="/crm/settings/custom-fields"
            className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors group"
          >
            <LinkIcon size={14} className="shrink-0" />
            <span>Добавить пользовательские поля в настройках</span>
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DealRightDrawer({
  deal,
  stages,
  customFields = [],
  onClose,
  onDealUpdate,
}: DealRightDrawerProps) {
  const open = deal !== null;
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const { widthPx: sidebarWidth } = useSidebar();
  const [, startTransition] = useTransition();

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

  const handleFieldSave = useCallback(
    async (code: string, value: unknown) => {
      if (!deal) return;
      const updatedValues = { ...deal.customFieldValues, [code]: value };
      startTransition(async () => {
        try {
          await saveDealCustomFieldValues(deal.id, updatedValues);
          if (onDealUpdate) {
            onDealUpdate({ ...deal, customFieldValues: updatedValues });
          }
        } catch (e) {
          console.error("Failed to save custom field value", e);
        }
      });
    },
    [deal, onDealUpdate]
  );

  return (
    <AnimatePresence>
      {deal && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed top-0 bottom-0 z-[80] bg-black/40"
            style={{ left: sidebarWidth, right: CRM_RIGHT_BAR_W }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer panel — full content area width */}
          <motion.div
            key="deal-right-drawer"
            role="dialog"
            aria-modal="true"
            className="fixed top-0 bottom-0 z-[90] bg-white shadow-2xl flex flex-col overflow-hidden"
            style={{ left: sidebarWidth, right: CRM_RIGHT_BAR_W }}
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
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 mt-0.5 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
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
            <div className={`flex-1 ${activeTab === "chat" ? "overflow-hidden" : "overflow-y-auto pt-4"}`}>
              {activeTab === "details" && (
                <DetailsTab
                  deal={deal}
                  stages={stages}
                  customFields={customFields}
                  onFieldSave={handleFieldSave}
                />
              )}
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
