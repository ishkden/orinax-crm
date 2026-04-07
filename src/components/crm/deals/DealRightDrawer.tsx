"use client";

import { useEffect, useState, useCallback, useTransition, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Banknote, Calendar, CheckSquare, MessageSquare,
  AlignLeft, Pencil, Check, SlidersHorizontal,
  FileText, ChevronDown, Plus, FolderOpen,
  Type, List, Clock, MapPin, Link2, Paperclip,
  DollarSign, ToggleLeft, Hash, CalendarRange, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Deal, Stage, Pipeline } from "./types";
import type { CustomFieldDef, CustomFieldType } from "@/app/actions/custom-fields";
import { saveDealCustomFieldValues, createCustomField } from "@/app/actions/custom-fields";
import { updateDealStage, updateDealPipeline } from "@/app/actions/deals";
import ContactInfoBlock from "./ContactInfoBlock";
import { getContactByCuid } from "@/app/actions/contacts";
import type { ContactDetail } from "@/app/actions/contacts";
import ContactDetailDrawer from "@/components/crm/contacts/ContactDetailDrawer";
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
  onFieldCreated?: (field: CustomFieldDef) => void;
}

type TabId = "general" | "tasks" | "chat" | "docs";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "general",  label: "Общие",     icon: <AlignLeft size={14} /> },
  { id: "tasks",    label: "Задачи",    icon: <CheckSquare size={14} /> },
  { id: "chat",     label: "Чат",       icon: <MessageSquare size={14} /> },
  { id: "docs",     label: "Документы", icon: <FileText size={14} /> },
];

// ─── Field type definitions ────────────────────────────────────────────────────

const FIELD_TYPES: { value: CustomFieldType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "STRING",   label: "Строка",     icon: <Type size={14} />,          color: "text-blue-500 bg-blue-50" },
  { value: "TEXT",     label: "Текст",      icon: <AlignLeft size={14} />,     color: "text-indigo-500 bg-indigo-50" },
  { value: "NUMBER",   label: "Число",      icon: <Hash size={14} />,          color: "text-rose-500 bg-rose-50" },
  { value: "LIST",     label: "Список",     icon: <List size={14} />,          color: "text-violet-500 bg-violet-50" },
  { value: "DATE",     label: "Дата",       icon: <Calendar size={14} />,      color: "text-orange-500 bg-orange-50" },
  { value: "DATETIME", label: "Дата/Время", icon: <Clock size={14} />,         color: "text-amber-500 bg-amber-50" },
  { value: "BOOLEAN",  label: "Да/Нет",     icon: <ToggleLeft size={14} />,    color: "text-pink-500 bg-pink-50" },
  { value: "MONEY",    label: "Деньги",     icon: <DollarSign size={14} />,    color: "text-emerald-500 bg-emerald-50" },
  { value: "URL",      label: "Ссылка",     icon: <Link2 size={14} />,         color: "text-sky-500 bg-sky-50" },
  { value: "ADDRESS",  label: "Адрес",      icon: <MapPin size={14} />,        color: "text-green-500 bg-green-50" },
  { value: "FILE",     label: "Файл",       icon: <Paperclip size={14} />,     color: "text-slate-500 bg-slate-50" },
  { value: "RESOURCE", label: "Ресурс",     icon: <CalendarRange size={14} />, color: "text-cyan-500 bg-cyan-50" },
];

// ─── Add Field Modal ──────────────────────────────────────────────────────────

function AddFieldModal({
  existingSections,
  onClose,
  onCreate,
}: {
  existingSections: string[];
  onClose: () => void;
  onCreate: (field: CustomFieldDef) => void;
}) {
  const [step, setStep] = useState<"section" | "field">("section");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [newSectionName, setNewSectionName] = useState("");
  const [creatingNewSection, setCreatingNewSection] = useState(existingSections.length === 0);

  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldType>("STRING");
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [optionDraft, setOptionDraft] = useState("");
  const [required, setRequired] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sectionValue = creatingNewSection ? newSectionName.trim() : selectedSection;

  function goToField() {
    if (!sectionValue) return;
    setStep("field");
  }

  function addOption() {
    const v = optionDraft.trim();
    if (!v || fieldOptions.includes(v)) return;
    setFieldOptions(prev => [...prev, v]);
    setOptionDraft("");
  }

  function handleCreate() {
    if (!fieldName.trim() || !sectionValue) return;
    setError(null);
    startTransition(async () => {
      try {
        const created = await createCustomField({
          name: fieldName.trim(),
          type: fieldType,
          entityType: "DEAL",
          options: fieldOptions.length > 0 ? fieldOptions : undefined,
          required,
          section: sectionValue,
        });
        onCreate(created);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка создания поля");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {step === "field" && (
              <button
                type="button"
                onClick={() => setStep("section")}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <ChevronRight size={16} className="rotate-180" />
              </button>
            )}
            <h2 className="text-sm font-semibold text-gray-900">
              {step === "section" ? "Выбор раздела" : "Новое поле"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {step === "section" ? (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Поле можно добавить только в раздел. Выберите существующий или создайте новый.
              </p>

              {/* Existing sections */}
              {existingSections.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Существующие разделы</p>
                  <div className="space-y-1">
                    {existingSections.map(sec => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => { setSelectedSection(sec); setCreatingNewSection(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                          !creatingNewSection && selectedSection === sec
                            ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                            : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <FolderOpen size={15} className={!creatingNewSection && selectedSection === sec ? "text-brand-600" : "text-gray-400"} />
                        <span className="text-sm font-medium text-gray-700">{sec}</span>
                        {!creatingNewSection && selectedSection === sec && (
                          <Check size={14} className="ml-auto text-brand-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* New section */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setCreatingNewSection(true)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all ${
                    creatingNewSection
                      ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                      : "border-dashed border-gray-200 hover:border-brand-300 hover:bg-gray-50"
                  }`}
                >
                  <Plus size={15} className={creatingNewSection ? "text-brand-600" : "text-gray-400"} />
                  <span className={`text-sm font-medium ${creatingNewSection ? "text-brand-700" : "text-gray-500"}`}>
                    Создать новый раздел
                  </span>
                </button>

                {creatingNewSection && (
                  <input
                    autoFocus
                    type="text"
                    value={newSectionName}
                    onChange={e => setNewSectionName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sectionValue && goToField()}
                    placeholder="Название раздела"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={goToField}
                disabled={!sectionValue}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Далее
                <ChevronRight size={15} />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Section badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 border border-brand-100 w-fit">
                <FolderOpen size={13} className="text-brand-600" />
                <span className="text-xs font-medium text-brand-700">{sectionValue}</span>
              </div>

              {/* Field name */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Название поля
                </label>
                <input
                  autoFocus
                  type="text"
                  value={fieldName}
                  onChange={e => setFieldName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !isPending && fieldName.trim() && handleCreate()}
                  placeholder="Например: Источник лида"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Field type */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Тип поля
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {FIELD_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setFieldType(t.value)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-left transition-all ${
                        fieldType === t.value
                          ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                          : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <span className={`shrink-0 rounded-md p-1 ${t.color}`}>{t.icon}</span>
                      <span className="text-xs font-medium text-gray-700 truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* List options */}
              {fieldType === "LIST" && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Значения списка
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={optionDraft}
                      onChange={e => setOptionDraft(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addOption())}
                      placeholder="Введите значение и нажмите Enter"
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                    <button type="button" onClick={addOption} className="px-3 py-2 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                  {fieldOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {fieldOptions.map((opt, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg">
                          {opt}
                          <button type="button" onClick={() => setFieldOptions(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Required toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setRequired(!required)}
                  className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${required ? "bg-brand-600" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${required ? "translate-x-4" : ""}`} />
                </div>
                <span className="text-sm text-gray-700">Обязательное поле</span>
              </label>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!fieldName.trim() || isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isPending ? "Создание..." : "Создать поле"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

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
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${p.id === currentPipelineId ? "text-brand-600 bg-brand-50 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
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

// ─── Details Left (custom fields grouped by section) ─────────────────────────

function DetailsLeft({ deal, customFields, onFieldSave, onOpenContact, onAddField }: {
  deal: Deal;
  customFields: CustomFieldDef[];
  onFieldSave: (code: string, value: unknown) => Promise<void>;
  onOpenContact: (contactCuid: string) => void;
  onAddField: () => void;
}) {
  const sections = customFields.reduce<Record<string, CustomFieldDef[]>>((acc, f) => {
    const sec = f.section ?? "Основное";
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-4 pb-6">
      <ContactInfoBlock deal={deal} onOpenContact={onOpenContact} />

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

      {/* Custom fields grouped by section */}
      {Object.keys(sections).length > 0 ? (
        <div className="space-y-3">
          {Object.entries(sections).map(([sectionName, fields]) => (
            <div key={sectionName}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                  <FolderOpen size={11} className="text-gray-300" />
                  {sectionName}
                </p>
                <Link href="/crm/settings/custom-fields" className="flex items-center gap-1 text-[10px] text-gray-300 hover:text-brand-500 transition-colors">
                  <SlidersHorizontal size={10} /> Настроить
                </Link>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white px-4 divide-y divide-gray-50">
                {fields.map(f => (
                  <CustomFieldRow key={f.id} field={f} value={deal.customFieldValues?.[f.code] ?? null} onSave={onFieldSave} />
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={onAddField}
            className="w-full flex items-center gap-2 rounded-xl border border-dashed border-gray-200 px-4 py-2.5 text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors"
          >
            <Plus size={14} className="shrink-0" />
            <span>Добавить поле</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onAddField}
          className="w-full flex items-center gap-2 rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors"
        >
          <Plus size={14} className="shrink-0" />
          <span>Добавить пользовательские поля</span>
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DealRightDrawer({ deal, stages, pipelines, customFields = [], onClose, onDealUpdate, onFieldCreated }: DealRightDrawerProps) {
  const open = deal !== null;
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const { widthPx: sidebarWidth } = useSidebar();
  const [, startTransition] = useTransition();

  const [currentPipelineId, setCurrentPipelineId] = useState<string | null>(null);
  const [currentStageId, setCurrentStageId] = useState<string | null>(null);
  const [stageChanging, setStageChanging] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [drawerContact, setDrawerContact] = useState<ContactDetail | null>(null);
  const [showAddField, setShowAddField] = useState(false);

  const openContactDrawer = useCallback(async (contactCuid: string) => {
    const data = await getContactByCuid(contactCuid);
    if (data) setDrawerContact(data);
  }, []);

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
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showAddField) setShowAddField(false);
        else onClose();
      }
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose, showAddField]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) { setActiveTab("general"); setShowAddField(false); }
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

  const existingSections = Array.from(new Set(customFields.map(f => f.section).filter(Boolean) as string[]));

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

              <div className="mb-3">
                <PipelineSelector pipelines={pipelines} currentPipelineId={currentPipelineId} onSelect={handlePipelineSelect} loading={stageChanging} />
              </div>

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
                    <DetailsLeft
                      deal={deal}
                      customFields={customFields}
                      onFieldSave={handleFieldSave}
                      onOpenContact={openContactDrawer}
                      onAddField={() => setShowAddField(true)}
                    />
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

          {/* ── Add Field Modal ── */}
          <AnimatePresence>
            {showAddField && (
              <AddFieldModal
                existingSections={existingSections}
                onClose={() => setShowAddField(false)}
                onCreate={(field) => {
                  if (onFieldCreated) onFieldCreated(field);
                  setShowAddField(false);
                }}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return (
    <>
      {createPortal(content, document.body)}
      <ContactDetailDrawer contact={drawerContact} onClose={() => setDrawerContact(null)} />
    </>
  );
}
