"use client";

import { useEffect, useState, useCallback, useTransition, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Banknote, Calendar, CheckSquare, MessageSquare,
  AlignLeft, Pencil, Check, SlidersHorizontal, Link as LinkIcon,
  FileText, ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Deal, Stage, Pipeline } from "./types";
import type { CustomFieldDef, CustomFieldType } from "@/app/actions/custom-fields";
import { saveDealCustomFieldValues } from "@/app/actions/custom-fields";
import { updateDealStage, updateDealPipeline } from "@/app/actions/deals";
import ContactInfoBlock from "./ContactInfoBlock";
import ActivityFeed from "./ActivityFeed";
import TaskList from "./TaskList";
import ChatPanel from "./ChatPanel";
import { CRM_RIGHT_BAR_W } from "@/components/crm/crmChrome";
import { useSidebar } from "@/components/layout/SidebarContext";

interface DealRightDrawerProps {
  deal: Deal | null;
  stages: Stage[];
  pipelines: Pipeline[];
  customFields?: CustomFieldDef[];
  onClose: () => void;
  onDealUpdate?: (deal: Deal) => void;
}

type TabId = "general" | "tasks" | "chat" | "docs";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "general",  label: "Общие",     icon: <AlignLeft size={14} /> },
  { id: "tasks",    label: "Задачи",    icon: <CheckSquare size={14} /> },
  { id: "chat",     label: "Чат",       icon: <MessageSquare size={14} /> },
  { id: "docs",     label: "Документы", icon: <FileText size={14} /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function CustomFieldInput({ field, value, onChange }: { field: CustomFieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const cls = "w-full rounded-lg border border-brand-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";
  switch (field.type) {
    case "STRING": case "ADDRESS": case "URL":
      return <input autoFocus type={field.type === "URL" ? "url" : "text"} value={(value as string) ?? ""} onChange={e => onChange(e.target.value)} className={cls} placeholder={field.type === "URL" ? "https://" : ""} />;
    case "TEXT":
      return <textarea autoFocus rows={3} value={(value as string) ?? ""} onChange={e => onChange(e.target.value)} className={cls + " resize-none"} />;
    case "NUMBER":
      return <input autoFocus type="number" value={(value as number) ?? ""} onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))} className={cls} />;
    case "BOOLEAN": {
      const checked = Boolean(value);
      return <button type="button" onClick={() => onChange(!checked)} className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-brand-600" : "bg-gray-200"}`}><span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} /></button>;
    }
    case "DATE":
      return <input autoFocus type="date" value={(value as string) ?? ""} onChange={e => onChange(e.target.value)} className={cls} />;
    case "DATETIME":
      return <input autoFocus type="datetime-local" value={(value as string) ?? ""} onChange={e => onChange(e.target.value)} className={cls} />;
    case "MONEY": {
      const m = (value as { amount?: number; currency?: string }) ?? {};
      return (
        <div className="flex gap-1">
          <input autoFocus type="number" value={m.amount ?? ""} onChange={e => onChange({ ...m, amount: e.target.value === "" ? null : Number(e.target.value) })} placeholder="0" className={cls + " flex-1"} />
          <select value={m.currency ?? "RUB"} onChange={e => onChange({ ...m, currency: e.target.value })} className="rounded-lg border border-brand-300 bg-white px-2 py-1.5 text-sm outline-none">
            {["RUB","USD","EUR","KZT","BYN"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      );
    }
    case "LIST": {
      const options = field.options ?? [];
      const selectedArr = Array.isArray(value) ? (value as string[]) : value ? [value as string] : [];
      function toggle(opt: string) { const next = selectedArr.includes(opt) ? selectedArr.filter(x => x !== opt) : [...selectedArr, opt]; onChange(next.length === 0 ? null : next); }
      return (
        <div className="flex flex-wrap gap-1.5">
          {options.map(opt => <button key={opt} type="button" onClick={() => toggle(opt)} className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${selectedArr.includes(opt) ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"}`}>{opt}</button>)}
        </div>
      );
    }
    default:
      return <input autoFocus type="text" value={(value as string) ?? ""} onChange={e => onChange(e.target.value)} className={cls} />;
  }
}

function CustomFieldRow({ field, value, onSave }: { field: CustomFieldDef; value: unknown; onSave: (code: string, v: unknown) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<unknown>(value);
  const [saving, setSaving] = useState(false);

  function startEdit() { setDraft(value); setEditing(true); }
  async function commit() { setSaving(true); setEditing(false); await onSave(field.code, draft); setSaving(false); }
  function cancel() { setDraft(value); setEditing(false); }

  const displayValue = formatFieldValue(value, field.type);
  const isEmpty = displayValue === "—";
  const isBool = field.type === "BOOLEAN";

  if (isBool) {
    return (
      <div className="flex items-center gap-3 py-2 group">
        <p className="text-xs text-gray-500 w-36 shrink-0">{field.name}</p>
        <button type="button" onClick={() => onSave(field.code, !value)} className={`relative w-9 h-5 rounded-full transition-colors ${value ? "bg-brand-600" : "bg-gray-200"}`}>
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : ""}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="py-2 group">
      <p className="text-xs text-gray-400 mb-0.5">{field.name}</p>
      {editing ? (
        <div className="space-y-1.5">
          <CustomFieldInput field={field} value={draft} onChange={setDraft} />
          <div className="flex gap-1.5">
            <button type="button" onClick={commit} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-600 text-white text-xs hover:bg-brand-700 transition-colors"><Check size={11} /> Сохранить</button>
            <button type="button" onClick={cancel} className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">Отмена</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={startEdit} className={`text-left w-full group/val flex items-center gap-1.5 ${saving ? "opacity-50" : ""}`}>
          <span className={`text-sm leading-relaxed ${isEmpty ? "text-gray-300 italic" : "text-gray-900"}`}>{saving ? "Сохранение..." : displayValue}</span>
          <Pencil size={11} className="text-gray-300 opacity-0 group-hover/val:opacity-100 transition-opacity shrink-0" />
        </button>
      )}
    </div>
  );
}

// ─── Pipeline Selector ────────────────────────────────────────────────────────

function PipelineSelector({ pipelines, currentPipelineId, onSelect, loading }: {
  pipelines: Pipeline[];
  currentPipelineId: string | null;
  onSelect: (p: Pipeline) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = pipelines.find(p => p.id === currentPipelineId);

  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={() => !loading && setOpen(v => !v)} disabled={loading}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 hover:bg-white hover:border-gray-300 transition-colors disabled:opacity-50">
        <span>{current?.label ?? "Без воронки"}</span>
        <ChevronDown size={12} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-[200] py-1 max-h-60 overflow-y-auto">
          <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Перенести в воронку</p>
          {pipelines.map(p => (
            <button key={p.id} onClick={() => { onSelect(p); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${p.id === currentPipelineId ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
              {p.id === currentPipelineId && <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0" />}
              {p.id !== currentPipelineId && <span className="w-1.5 shrink-0" />}
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stage Kanban ─────────────────────────────────────────────────────────────

function StageKanban({ stages, currentStageId, onStageChange, loading }: {
  stages: Stage[];
  currentStageId: string | null;
  onStageChange: (stage: Stage) => void;
  loading: boolean;
}) {
  if (stages.length === 0) return null;
  const currentIdx = stages.findIndex(s => s.id === currentStageId);

  return (
    <div className="flex w-full overflow-x-auto rounded-lg overflow-hidden border border-gray-200">
      {stages.map((stage, idx) => {
        const isPast = currentIdx >= 0 && idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const filled = isPast || isCurrent;
        const stageColor = stage.color || "#6366f1";

        return (
          <button key={stage.id} onClick={() => !loading && onStageChange(stage)} disabled={loading} title={stage.label}
            className={`flex-1 min-w-0 px-2 py-2.5 text-[11px] font-semibold text-center transition-all border-r border-white/30 last:border-r-0 truncate ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            style={filled ? { backgroundColor: stageColor, color: "#fff" } : { backgroundColor: "#f3f4f6", color: "#6b7280" }}>
            {stage.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Details Left Panel ───────────────────────────────────────────────────────

function DetailsLeft({ deal, customFields, onFieldSave }: {
  deal: Deal;
  customFields: CustomFieldDef[];
  onFieldSave: (code: string, value: unknown) => Promise<void>;
}) {
  return (
    <div className="space-y-4 pb-6">
      <ContactInfoBlock deal={deal} />

      <div className="rounded-xl border border-gray-100 bg-gray-50/60 divide-y divide-gray-100 overflow-hidden">
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
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Описание</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{deal.description}</p>
        </div>
      )}

      {customFields.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Пользовательские поля</p>
            <Link href="/crm/settings/custom-fields" className="flex items-center gap-1 text-[10px] text-gray-300 hover:text-brand-500 transition-colors">
              <SlidersHorizontal size={10} /> Настроить
            </Link>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white px-4 divide-y divide-gray-50">
            {customFields.map(f => (
              <CustomFieldRow key={f.id} field={f} value={deal.customFieldValues?.[f.code] ?? null} onSave={onFieldSave} />
            ))}
          </div>
        </div>
      )}

      {customFields.length === 0 && (
        <Link href="/crm/settings/custom-fields" className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors">
          <LinkIcon size={14} className="shrink-0" />
          <span>Добавить пользовательские поля</span>
        </Link>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DealRightDrawer({ deal, stages, pipelines, customFields = [], onClose, onDealUpdate }: DealRightDrawerProps) {
  const open = deal !== null;
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const { widthPx: sidebarWidth } = useSidebar();
  const [, startTransition] = useTransition();

  const [currentPipelineId, setCurrentPipelineId] = useState<string | null>(null);
  const [currentStageId, setCurrentStageId] = useState<string | null>(null);
  const [stageChanging, setStageChanging] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (deal) {
      setCurrentPipelineId(deal.pipelineId);
      setCurrentStageId(deal.stageId ?? deal.stage);
    }
  }, [deal?.id]);

  const currentPipeline = pipelines.find(p => p.id === currentPipelineId) ?? pipelines[0] ?? null;
  const currentStages: Stage[] = currentPipeline?.stages ?? stages;

  useEffect(() => {
    if (!open) return;
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) setActiveTab("general");
  }, [open]);

  const handleFieldSave = useCallback(async (code: string, value: unknown) => {
    if (!deal) return;
    const updatedValues = { ...deal.customFieldValues, [code]: value };
    startTransition(async () => {
      try {
        await saveDealCustomFieldValues(deal.id, updatedValues);
        if (onDealUpdate) onDealUpdate({ ...deal, customFieldValues: updatedValues });
      } catch (e) { console.error("Failed to save custom field value", e); }
    });
  }, [deal, onDealUpdate]);

  async function handlePipelineSelect(pipeline: Pipeline) {
    if (!deal || pipeline.id === currentPipelineId) return;
    const firstStage = pipeline.stages[0];
    setStageChanging(true);
    try {
      await updateDealPipeline(deal.id, pipeline.id, firstStage?.id ?? "");
      setCurrentPipelineId(pipeline.id);
      setCurrentStageId(firstStage?.id ?? null);
      if (onDealUpdate) onDealUpdate({ ...deal, pipelineId: pipeline.id, stageId: firstStage?.id ?? null, stage: firstStage?.id ?? deal.stage });
    } catch (e) { console.error("Failed to update pipeline", e); }
    finally { setStageChanging(false); }
  }

  async function handleStageChange(stage: Stage) {
    if (!deal || stage.id === currentStageId) return;
    setStageChanging(true);
    try {
      await updateDealStage(deal.id, stage.id);
      setCurrentStageId(stage.id);
      if (onDealUpdate) onDealUpdate({ ...deal, stageId: stage.id, stage: stage.id });
    } catch (e) { console.error("Failed to update stage", e); }
    finally { setStageChanging(false); }
  }

  const content = (
    <AnimatePresence>
      {deal && (
        <>
          <motion.div className="fixed inset-0 z-[80] bg-black/65" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />

          <motion.div key="deal-right-drawer" role="dialog" aria-modal="true"
            className="fixed top-0 bottom-0 z-[90] bg-white shadow-2xl flex flex-col overflow-hidden"
            style={{ left: sidebarWidth, right: CRM_RIGHT_BAR_W }}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}>

            {/* ── Header ── */}
            <div className="shrink-0 border-b border-gray-100 px-5 pt-4 pb-3">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="text-lg font-semibold text-gray-900 leading-tight line-clamp-2">{deal.title}</h2>
                <button type="button" onClick={onClose} className="shrink-0 mt-0.5 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"><X size={18} /></button>
              </div>

              {/* Pipeline selector */}
              <div className="mb-3">
                <PipelineSelector pipelines={pipelines} currentPipelineId={currentPipelineId} onSelect={handlePipelineSelect} loading={stageChanging} />
              </div>

              {/* Stage kanban */}
              <StageKanban stages={currentStages} currentStageId={currentStageId} onStageChange={handleStageChange} loading={stageChanging} />
            </div>

            {/* ── Tabs nav ── */}
            <div className="shrink-0 flex border-b border-gray-100 px-4 gap-0">
              {TABS.map(tab => (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>

            {/* ── Tab content ── */}
            <div className={`flex-1 min-h-0 ${activeTab === "chat" ? "overflow-hidden" : "overflow-y-auto"}`}>

              {activeTab === "general" && (
                <div className="grid grid-cols-5 divide-x divide-gray-100 h-full">
                  <div className="col-span-2 overflow-y-auto p-4">
                    <DetailsLeft deal={deal} customFields={customFields} onFieldSave={handleFieldSave} />
                  </div>
                  <div className="col-span-3 overflow-y-auto p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Лента активности</p>
                    <ActivityFeed dealId={deal.id} />
                  </div>
                </div>
              )}

              {activeTab === "tasks" && (
                <div className="p-4"><TaskList dealId={deal.id} /></div>
              )}

              {activeTab === "chat" && <ChatPanel dealId={deal.id} />}

              {activeTab === "docs" && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <FileText size={40} strokeWidth={1.25} className="opacity-30" />
                  <p className="text-sm">Документы — в разработке</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
  if (!mounted) return null;
  return createPortal(content, document.body);
}
