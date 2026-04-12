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
  Trash2, Search, Layers, Settings,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, contrastTextOnHex } from "@/lib/utils";
import type { Deal, Stage, Pipeline } from "./types";
import type { CustomFieldDef, CustomFieldType, PipelineSectionInfo } from "@/app/actions/custom-fields";
import {
  saveDealCustomFieldValues,
  createCustomField,
  updateCustomField,
  getAllSectionsWithFields,
  cloneSectionToPipeline,
} from "@/app/actions/custom-fields";
import { updateDealStage, updateDealPipeline } from "@/app/actions/deals";
import ContactInfoBlock from "./ContactInfoBlock";
import CreateContactModal from "@/components/crm/contacts/CreateContactModal";
import type { CreateContactFormData } from "@/components/crm/contacts/CreateContactModal";
import { createContact } from "@/app/actions/contacts";
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
  onFieldUpdated?: (field: CustomFieldDef) => void;
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

// ─── Create Section Modal ─────────────────────────────────────────────────────

function CreateSectionModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (sectionName: string) => void;
}) {
  const [name, setName] = useState("");

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Создать раздел</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500">Введите название раздела. После создания вы сможете добавить в него поля.</p>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreate()}
            placeholder="Например: Дополнительная информация"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={!name.trim()}
              className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Создать раздел
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
      </motion.div>
    </div>
  );
}

// ─── Choose Section Modal ─────────────────────────────────────────────────────

function ChooseSectionModal({
  currentPipelineId,
  existingSectionNames,
  onClose,
  onSelect,
}: {
  currentPipelineId: string | null;
  existingSectionNames: string[];
  onClose: () => void;
  onSelect: (section: PipelineSectionInfo) => Promise<void>;
}) {
  const [sections, setSections] = useState<PipelineSectionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    getAllSectionsWithFields().then(data => {
      setSections(data);
      setLoading(false);
    });
  }, []);

  const FIELD_TYPE_LABELS: Record<string, string> = {
    STRING: "Строка", TEXT: "Текст", NUMBER: "Число", LIST: "Список",
    DATE: "Дата", DATETIME: "Дата/Время", BOOLEAN: "Да/Нет",
    MONEY: "Деньги", URL: "Ссылка", ADDRESS: "Адрес", FILE: "Файл", RESOURCE: "Ресурс",
  };

  // Group sections by pipeline, filter by search
  const grouped = sections.reduce<Record<string, PipelineSectionInfo[]>>((acc, s) => {
    const q = search.toLowerCase();
    if (q && !s.sectionName.toLowerCase().includes(q) && !s.pipelineName.toLowerCase().includes(q)) return acc;
    if (!acc[s.pipelineId]) acc[s.pipelineId] = [];
    acc[s.pipelineId].push(s);
    return acc;
  }, {});

  const alreadyAdded = new Set(existingSectionNames);

  async function handleSelect(section: PipelineSectionInfo) {
    const key = `${section.pipelineId}::${section.sectionName}`;
    setSelecting(key);
    await onSelect(section);
    setSelecting(null);
  }

  const hasAny = Object.keys(grouped).length > 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Выбрать раздел</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск разделов..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="max-h-[420px] overflow-y-auto space-y-4">
            {loading ? (
              <div className="text-center py-10 text-gray-400 text-sm">Загрузка...</div>
            ) : !hasAny ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                {sections.length === 0 ? "Нет созданных разделов в других воронках" : "Ничего не найдено"}
              </div>
            ) : (
              Object.entries(grouped).map(([pipelineId, pSections]) => {
                const pipelineName = pSections[0].pipelineName;
                return (
                  <div key={pipelineId}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-1.5">
                      Воронка: {pipelineName}
                    </p>
                    <div className="space-y-2">
                      {pSections.map(section => {
                        const key = `${section.pipelineId}::${section.sectionName}`;
                        const isCurrentPipeline = section.pipelineId === currentPipelineId;
                        const alreadyHere = alreadyAdded.has(section.sectionName);
                        const disabled = isCurrentPipeline || alreadyHere || selecting !== null;
                        const isSelecting = selecting === key;

                        return (
                          <div
                            key={key}
                            className={`rounded-xl border overflow-hidden transition-all ${
                              disabled && !isSelecting
                                ? "border-gray-100 bg-gray-50 opacity-60"
                                : "border-gray-200 bg-white hover:border-brand-300 hover:shadow-sm"
                            }`}
                          >
                            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
                              <div className="flex items-center gap-1.5">
                                <FolderOpen size={13} className="text-gray-400" />
                                <span className="text-xs font-semibold text-gray-700">{section.sectionName}</span>
                                {(isCurrentPipeline || alreadyHere) && (
                                  <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">уже добавлен</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => !disabled && handleSelect(section)}
                                disabled={disabled}
                                className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                                  disabled
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-brand-600 hover:bg-brand-50"
                                }`}
                              >
                                {isSelecting ? "Добавляется..." : "Добавить"}
                              </button>
                            </div>
                            <div className="px-3 py-2 space-y-0.5">
                              {section.fields.map(f => (
                                <div key={f.id} className="flex items-center gap-2 py-0.5">
                                  <span className="text-xs text-gray-600">{f.name}</span>
                                  <span className="text-[10px] text-gray-400">— {FIELD_TYPE_LABELS[f.type] ?? f.type}</span>
                                </div>
                              ))}
                              {section.fields.length === 0 && (
                                <p className="text-xs text-gray-400 italic">Нет полей</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Add Field Modal ──────────────────────────────────────────────────────────

function AddFieldModal({
  sectionName,
  onClose,
  onCreate,
}: {
  sectionName: string;
  onClose: () => void;
  onCreate: (field: CustomFieldDef) => void;
}) {
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldType>("STRING");
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [optionDraft, setOptionDraft] = useState("");
  const [required, setRequired] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function addOption() {
    const v = optionDraft.trim();
    if (!v || fieldOptions.includes(v)) return;
    setFieldOptions(prev => [...prev, v]);
    setOptionDraft("");
  }

  function handleCreate(pipelineId?: string | null) {
    if (!fieldName.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const created = await createCustomField({
          name: fieldName.trim(),
          type: fieldType,
          entityType: "DEAL",
          options: fieldOptions.length > 0 ? fieldOptions : undefined,
          required,
          section: sectionName,
          pipelineId: pipelineId ?? null,
        });
        onCreate(created);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка создания поля");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-50 border border-brand-100">
              <FolderOpen size={12} className="text-brand-600" />
              <span className="text-xs font-medium text-brand-700">{sectionName}</span>
            </div>
            <h2 className="text-sm font-semibold text-gray-900">— Новое поле</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Название поля</label>
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

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Тип поля</label>
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

          {fieldType === "LIST" && (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Значения списка</label>
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
                <div className="space-y-1">
                  {fieldOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                      <span className="flex-1 text-sm text-gray-700">{opt}</span>
                      <button type="button" onClick={() => setFieldOptions(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
              onClick={() => handleCreate()}
              disabled={!fieldName.trim() || isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Создание..." : "Создать поле"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Отмена
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Select Field Modal (existing fields → add to section) ────────────────────

function SelectFieldModal({
  availableFields,
  onClose,
  onSelect,
}: {
  availableFields: CustomFieldDef[];
  onClose: () => void;
  onSelect: (field: CustomFieldDef) => void;
}) {
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selecting, setSelecting] = useState<string | null>(null);

  const filtered = availableFields.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  function handleSelect(field: CustomFieldDef) {
    setSelecting(field.id);
    startTransition(async () => {
      await onSelect(field);
      setSelecting(null);
    });
  }

  const FIELD_TYPE_LABELS: Record<string, string> = {
    STRING: "Строка", TEXT: "Текст", NUMBER: "Число", LIST: "Список",
    DATE: "Дата", DATETIME: "Дата/Время", BOOLEAN: "Да/Нет",
    MONEY: "Деньги", URL: "Ссылка", ADDRESS: "Адрес", FILE: "Файл", RESOURCE: "Ресурс",
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Выбрать поле</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск полей..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              {availableFields.length === 0 ? "Нет доступных полей" : "Ничего не найдено"}
            </div>
          ) : (
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {filtered.map(field => (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => handleSelect(field)}
                  disabled={selecting === field.id || isPending}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-left transition-colors disabled:opacity-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{field.name}</p>
                    <p className="text-xs text-gray-400">{FIELD_TYPE_LABELS[field.type] ?? field.type}</p>
                  </div>
                  {selecting === field.id ? (
                    <span className="text-xs text-brand-600">Добавление...</span>
                  ) : (
                    <Plus size={15} className="text-gray-400 shrink-0" />
                  )}
                </button>
              ))}
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
      const v = Array.isArray(value) ? value[0] : value;
      return v ? String(v) : "—";
    }
    default: return String(value) || "—";
  }
}

// ─── Custom Field Input ───────────────────────────────────────────────────────

function CustomFieldInput({ field, value, onChange, onImmediateSave }: {
  field: CustomFieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  onImmediateSave?: (v: unknown) => void;
}) {
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
      return (
        <button type="button" onClick={() => { const next = !checked; onChange(next); onImmediateSave?.(next); }}
          className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-brand-600" : "bg-gray-200"}`}>
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
        </button>
      );
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
      const currentVal = Array.isArray(value) ? (value as string[])[0] ?? null : value as string ?? null;
      return (
        <div className="space-y-1">
          {options.map(opt => (
            <button key={opt} type="button"
              onClick={() => { const next = opt === currentVal ? null : opt; onChange(next); onImmediateSave?.(next); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left text-sm transition-colors ${opt === currentVal ? "border-brand-500 bg-brand-50 text-brand-700 font-medium" : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"}`}>
              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${opt === currentVal ? "border-brand-600" : "border-gray-300"}`}>
                {opt === currentVal && <span className="w-2 h-2 rounded-full bg-brand-600" />}
              </span>
              {opt}
            </button>
          ))}
          {options.length === 0 && <p className="text-xs text-gray-400 italic px-1">Нет значений в списке</p>}
        </div>
      );
    }
    default:
      return <input autoFocus type="text" value={(value as string) ?? ""} onChange={e => onChange(e.target.value)} className={cls} />;
  }
}

// ─── Custom Field Row ──────────────────────────────────────────────────────────────

function CustomFieldRow({ field, value, onSave, onRemove, onUpdate }: {
  field: CustomFieldDef;
  value: unknown;
  onSave: (code: string, v: unknown) => Promise<void>;
  onRemove: (fieldId: string) => Promise<void>;
  onUpdate: (fieldId: string, data: { name?: string; options?: string[] }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState<unknown>(value);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [configName, setConfigName] = useState(field.name);
  const [configOptions, setConfigOptions] = useState<string[]>(field.options ?? []);
  const [optionDraft, setOptionDraft] = useState("");
  const [configSaving, setConfigSaving] = useState(false);

  const isList = field.type === "LIST";
  const isBool = field.type === "BOOLEAN";

  function startEdit() { setDraft(value); setEditing(true); }

  async function commit(overrideDraft?: unknown) {
    const val = overrideDraft !== undefined ? overrideDraft : draft;
    setSaving(true);
    await onSave(field.code, val);
    setSaving(false);
    setEditing(false);
  }

  function cancel() { setDraft(value); setEditing(false); }

  async function handleRemove() {
    setRemoving(true);
    await onRemove(field.id);
    setRemoving(false);
  }

  function openConfig() {
    setConfigName(field.name);
    setConfigOptions(field.options ?? []);
    setOptionDraft("");
    setConfigOpen(true);
    setMenuOpen(false);
  }

  async function saveConfig() {
    setConfigSaving(true);
    await onUpdate(field.id, {
      name: configName.trim() || field.name,
      ...(isList ? { options: configOptions } : {}),
    });
    setConfigSaving(false);
    setConfigOpen(false);
  }

  const displayValue = formatFieldValue(value, field.type);
  const isEmpty = displayValue === "—";

  const gearMenu = (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
        className="p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
        title="Настройки поля"
      >
        <Settings size={12} />
      </button>
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[110px]">
            <button
              type="button"
              onClick={() => { setMenuOpen(false); handleRemove(); }}
              disabled={removing}
              className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Скрыть
            </button>
            <button
              type="button"
              onClick={openConfig}
              className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Настроить
            </button>
          </div>
        </>
      )}
    </div>
  );

  const configPanel = !configOpen ? null : (
    <div className="mt-1 mb-1 p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Название поля</label>
        <input
          type="text"
          value={configName}
          onChange={e => setConfigName(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>
      {isList && (
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Варианты ответа</label>
          <div className="space-y-1 mb-2">
            {configOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-lg border border-gray-100">
                <span className="flex-1 text-sm text-gray-700">{opt}</span>
                <button type="button" onClick={() => setConfigOptions(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={optionDraft}
              onChange={e => setOptionDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = optionDraft.trim();
                  if (v && !configOptions.includes(v)) { setConfigOptions(prev => [...prev, v]); setOptionDraft(""); }
                }
              }}
              placeholder="Новый вариант..."
              className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={() => { const v = optionDraft.trim(); if (v && !configOptions.includes(v)) { setConfigOptions(prev => [...prev, v]); setOptionDraft(""); } }}
              className="px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={saveConfig} disabled={configSaving}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs hover:bg-brand-700 disabled:opacity-50 transition-colors">
          <Check size={11} /> {configSaving ? "Сохранение..." : "Сохранить"}
        </button>
        <button type="button" onClick={() => setConfigOpen(false)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
          Отмена
        </button>
      </div>
    </div>
  );

  if (isBool) {
    return (
      <div className="py-2.5 group">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-gray-400">{field.name}</p>
          {gearMenu}
        </div>
        <button type="button" onClick={() => onSave(field.code, !value)} className={`relative w-9 h-5 rounded-full transition-colors ${value ? "bg-brand-600" : "bg-gray-200"}`}>
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : ""}`} />
        </button>
        {configPanel}
      </div>
    );
  }

  if (isList) {
    const options = field.options ?? [];
    const currentVal = Array.isArray(value) ? (value as string[])[0] ?? null : value as string ?? null;

    if (editing) {
      return (
        <div className="py-2.5 group">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 font-medium">{field.name}</p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={cancel} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded hover:bg-gray-100 transition-colors">Отмена</button>
              {gearMenu}
            </div>
          </div>
          <div className="space-y-1">
            {options.map(opt => (
              <button key={opt} type="button"
                onClick={async () => { const next = opt === currentVal ? null : opt; await commit(next); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left text-sm transition-colors ${opt === currentVal ? "border-brand-500 bg-brand-50 text-brand-700 font-medium" : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"}`}>
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${opt === currentVal ? "border-brand-600" : "border-gray-300"}`}>
                  {opt === currentVal && <span className="w-2 h-2 rounded-full bg-brand-600" />}
                </span>
                {opt}
              </button>
            ))}
            {options.length === 0 && <p className="text-xs text-gray-400 italic px-1">Нет значений в списке</p>}
          </div>
          {configPanel}
        </div>
      );
    }

    return (
      <div className="group">
        <div className="flex items-center justify-between py-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">{field.name}</p>
            <p className={`text-sm ${isEmpty ? "text-gray-300 italic" : "text-gray-900"}`}>{saving ? "Сохранение..." : displayValue}</p>
          </div>
          <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={startEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Редактировать">
              <Pencil size={12} />
            </button>
            {gearMenu}
          </div>
        </div>
        {configPanel}
      </div>
    );
  }

  return (
    <div className="py-2.5 group">
      <div className="flex items-center justify-between mb-0.5">
        <p className="text-xs text-gray-400">{field.name}</p>
        {!editing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={startEdit} className="p-1 rounded text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Редактировать">
              <Pencil size={12} />
            </button>
            {gearMenu}
          </div>
        )}
      </div>
      {editing ? (
        <div className="space-y-1.5">
          <CustomFieldInput field={field} value={draft} onChange={setDraft}
            onImmediateSave={async (v) => { await commit(v); }} />
          <div className="flex gap-1.5">
            <button type="button" onClick={() => commit()} disabled={saving}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-600 text-white text-xs hover:bg-brand-700 disabled:opacity-50 transition-colors">
              <Check size={11} /> {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button type="button" onClick={cancel} className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">Отмена</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={startEdit} className={`text-left w-full ${saving ? "opacity-50" : ""}`}>
          <span className={`text-sm leading-relaxed ${isEmpty ? "text-gray-300 italic" : "text-gray-900"}`}>{saving ? "Сохранение..." : displayValue}</span>
        </button>
      )}
      {configPanel}
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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (stages.length === 0) return null;
  const currentIdx = stages.findIndex(s => s.id === currentStageId);

  return (
    <div
      className="flex w-full rounded-lg overflow-hidden border border-gray-200"
      onMouseLeave={() => setHoveredIdx(null)}
    >
      {stages.map((stage, idx) => {
        const isPast = currentIdx >= 0 && idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isHovered = hoveredIdx === idx;
        const stageColor = /^#[0-9A-Fa-f]{6}$/.test(stage.color ?? "") ? stage.color! : "#6366f1";
        const textColor = contrastTextOnHex(stageColor);

        let bgColor: string;
        let fgColor: string;

        if (isHovered || isCurrent) {
          bgColor = stageColor;
          fgColor = textColor;
        } else if (isPast) {
          bgColor = stageColor;
          fgColor = textColor;
        } else {
          bgColor = "#f3f4f6";
          fgColor = "#9ca3af";
        }

        return (
          <button
            key={stage.id}
            onClick={() => !loading && onStageChange(stage)}
            onMouseEnter={() => setHoveredIdx(idx)}
            disabled={loading}
            title={stage.label}
            className="relative border-r border-white/40 last:border-r-0 overflow-hidden"
            style={{
              flexGrow: isHovered ? 3 : 1,
              flexShrink: 1,
              flexBasis: 0,
              backgroundColor: bgColor,
              color: fgColor,
              opacity: loading ? 0.6 : (isPast && !isHovered ? 0.55 : 1),
              cursor: loading ? "not-allowed" : "pointer",
              padding: "8px 6px",
              transition: "flex-grow 0.2s ease, background-color 0.2s ease, opacity 0.2s ease",
            }}
          >
            <span className="block text-[11px] font-semibold whitespace-nowrap truncate text-center">
              {stage.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Details Left ─────────────────────────────────────────────────────────────

function DetailsLeft({
  deal,
  customFields,
  currentPipelineId,
  pendingSections,
  onFieldSave,
  onFieldRemove,
  onFieldUpdate,
  onFieldAssign,
  onOpenContact,
  onAddField,
  onSelectField,
  onCreateSection,
  onChooseSection,
  onCreateContact,
}: {
  deal: Deal;
  customFields: CustomFieldDef[];
  currentPipelineId: string | null;
  pendingSections: string[];
  onFieldSave: (code: string, value: unknown) => Promise<void>;
  onFieldRemove: (fieldId: string) => Promise<void>;
  onFieldUpdate: (fieldId: string, data: { name?: string; options?: string[] }) => Promise<void>;
  onFieldAssign: (field: CustomFieldDef, sectionName: string) => Promise<void>;
  onOpenContact: (contactCuid: string) => void;
  onAddField: (sectionName: string) => void;
  onSelectField: (sectionName: string) => void;
  onCreateSection: () => void;
  onChooseSection: () => void;
  onCreateContact?: () => void;
}) {
  // Filter fields for the current pipeline (pipeline-specific + legacy global fields)
  const pipelineFields = customFields.filter(
    f => !f.pipelineId || f.pipelineId === currentPipelineId
  );

  const sections = pipelineFields.reduce<Record<string, CustomFieldDef[]>>((acc, f) => {
    const sec = f.section ?? "Основное";
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(f);
    return acc;
  }, {});

  // Include pending (empty) sections that don't yet have fields
  const allSectionNames = Array.from(
    new Set([...Object.keys(sections), ...pendingSections])
  );

  return (
    <div className="space-y-4 pb-6">
      <ContactInfoBlock deal={deal} onOpenContact={onOpenContact} onCreateContact={onCreateContact} />

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
      {allSectionNames.length > 0 && (
        <div className="space-y-3">
          {allSectionNames.map(sectionName => {
            const fields = sections[sectionName] ?? [];
            const isPending = fields.length === 0;
            return (
              <div key={sectionName} className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <FolderOpen size={11} className="text-gray-400" />
                    {sectionName}
                    {isPending && <span className="text-[9px] text-gray-300 font-normal normal-case tracking-normal ml-1">пустой</span>}
                  </p>
                  <Link href="/crm/settings/custom-fields" className="flex items-center gap-1 text-[10px] text-gray-300 hover:text-brand-500 transition-colors">
                    <SlidersHorizontal size={10} /> Настроить
                  </Link>
                </div>
                {fields.length > 0 && (
                  <div className="bg-white px-4 divide-y divide-gray-50">
                    {fields.map(f => (
                      <CustomFieldRow
                        key={f.id}
                        field={f}
                        value={deal.customFieldValues?.[f.code] ?? null}
                        onSave={onFieldSave}
                        onRemove={onFieldRemove}
                        onUpdate={onFieldUpdate}
                      />
                    ))}
                  </div>
                )}
                <div className="flex border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => onAddField(sectionName)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition-colors border-r border-gray-100"
                  >
                    <Plus size={12} /> Создать поле
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectField(sectionName)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    <List size={12} /> Выбрать поле
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Two minimal bottom buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCreateSection}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-200 px-3 py-2.5 text-sm text-gray-400 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/50 transition-colors"
        >
          <Plus size={14} className="shrink-0" />
          <span>Создать раздел</span>
        </button>
        <button
          type="button"
          onClick={onChooseSection}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-200 px-3 py-2.5 text-sm text-gray-400 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/50 transition-colors"
        >
          <Layers size={14} className="shrink-0" />
          <span>Выбрать раздел</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DealRightDrawer({
  deal,
  stages,
  pipelines,
  customFields = [],
  onClose,
  onDealUpdate,
  onFieldCreated,
  onFieldUpdated,
}: DealRightDrawerProps) {
  const open = deal !== null;
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const { widthPx: sidebarWidth } = useSidebar();
  const [, startTransition] = useTransition();

  const [currentPipelineId, setCurrentPipelineId] = useState<string | null>(null);
  const [currentStageId, setCurrentStageId] = useState<string | null>(null);
  const [stageChanging, setStageChanging] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [drawerContact, setDrawerContact] = useState<ContactDetail | null>(null);

  // Empty sections created before any field is added
  const [pendingSections, setPendingSections] = useState<string[]>([]);

  // Modals
  const [addFieldSection, setAddFieldSection] = useState<string | null>(null);
  const [selectFieldSection, setSelectFieldSection] = useState<string | null>(null);
  const [createSectionOpen, setCreateSectionOpen] = useState(false);
  const [chooseSectionOpen, setChooseSectionOpen] = useState(false);
  const [createContactOpen, setCreateContactOpen] = useState(false);

  // Scroll-fade: show scrollbar thumb only while actively scrolling
  useEffect(() => {
    if (!open) return;
    const el = contentRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      el.classList.add("is-scrolling");
      clearTimeout(timer);
      timer = setTimeout(() => el.classList.remove("is-scrolling"), 800);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { el.removeEventListener("scroll", onScroll); clearTimeout(timer); };
  }, [open]);

  // Scroll to tabs (top of content) when a new deal is opened
  useEffect(() => {
    if (!deal) return;
    requestAnimationFrame(() => {
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal?.id]);

  // Scroll to tabs when switching tabs
  useEffect(() => {
    requestAnimationFrame(() => {
      if (!contentRef.current) return;
      const tabsEl = tabsRef.current;
      if (!tabsEl) return;
      // Scroll so tabs are at the top (header scrolled away)
      const headerHeight = tabsEl.offsetTop - (contentRef.current.offsetTop ?? 0);
      contentRef.current.scrollTo({ top: headerHeight, behavior: "smooth" });
    });
  }, [activeTab]);

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
        if (addFieldSection !== null) { setAddFieldSection(null); return; }
        if (selectFieldSection !== null) { setSelectFieldSection(null); return; }
        if (createSectionOpen) { setCreateSectionOpen(false); return; }
        if (chooseSectionOpen) { setChooseSectionOpen(false); return; }
        onClose();
      }
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose, addFieldSection, selectFieldSection, createSectionOpen, chooseSectionOpen]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setActiveTab("general");
      setAddFieldSection(null);
      setSelectFieldSection(null);
      setCreateSectionOpen(false);
      setChooseSectionOpen(false);
      setCreateContactOpen(false);
      setPendingSections([]);
    }
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

  const handleFieldRemove = useCallback(async (fieldId: string) => {
    const field = customFields.find(f => f.id === fieldId);
    if (!field) return;
    try {
      const updated = await updateCustomField(fieldId, { section: null });
      if (onFieldUpdated) onFieldUpdated(updated);
    } catch (e) { console.error("Failed to remove field from section", e); }
  }, [customFields, onFieldUpdated]);

  const handleFieldUpdate = useCallback(async (fieldId: string, data: { name?: string; options?: string[] }) => {
    try {
      const updated = await updateCustomField(fieldId, data);
      if (onFieldUpdated) onFieldUpdated(updated);
    } catch (e) { console.error("Failed to update field", e); }
  }, [onFieldUpdated]);

  const handleFieldAssign = useCallback(async (field: CustomFieldDef, sectionName: string) => {
    try {
      const updated = await updateCustomField(field.id, { section: sectionName });
      if (onFieldUpdated) onFieldUpdated(updated);
    } catch (e) { console.error("Failed to assign field to section", e); }
  }, [onFieldUpdated]);

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

  // Section names currently in the pipeline
  const pipelineFields = customFields.filter(
    f => !f.pipelineId || f.pipelineId === currentPipelineId
  );
  const existingSectionNames = Array.from(
    new Set([
      ...pipelineFields.map(f => f.section).filter(Boolean) as string[],
      ...pendingSections,
    ])
  );

  // Fields available to be moved into a section (currently without a section or from other sections)
  const availableForSection = selectFieldSection !== null
    ? pipelineFields.filter(f => f.section !== selectFieldSection)
    : [];

  // Handler: "Create Section" — add to pending
  function handleCreateSection(sectionName: string) {
    if (!existingSectionNames.includes(sectionName)) {
      setPendingSections(prev => [...prev, sectionName]);
    }
    setCreateSectionOpen(false);
  }

  // Handler: "Choose Section" — clone fields to current pipeline
  async function handleCreateContact(data: CreateContactFormData) {
    if (!deal) return;
    try {
      const newContact = await createContact({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        email: data.email || undefined,
        company: data.company || undefined,
        position: data.position || undefined,
        dealId: deal.id,
      });
      if (onDealUpdate) {
        onDealUpdate({
          ...deal,
          contactId: newContact.id,
          contactName: `${newContact.firstName} ${newContact.lastName}`.trim(),
          contactPhone: newContact.phone,
          contactEmail: newContact.email,
          company: newContact.company ?? deal.company,
        });
      }
    } catch (e) { console.error("Failed to create contact", e); }
    setCreateContactOpen(false);
  }

  async function handleChooseSection(section: PipelineSectionInfo) {
    if (!currentPipelineId) return;
    try {
      const cloned = await cloneSectionToPipeline(section.fields, currentPipelineId, section.sectionName);
      for (const field of cloned) {
        if (onFieldCreated) onFieldCreated(field);
      }
      // Remove from pending if it was there
      setPendingSections(prev => prev.filter(n => n !== section.sectionName));
    } catch (e) { console.error("Failed to clone section", e); }
    setChooseSectionOpen(false);
  }

  // When a field is created in a pending section, remove from pending
  function handleFieldCreatedInSection(field: CustomFieldDef) {
    if (field.section) {
      setPendingSections(prev => prev.filter(n => n !== field.section));
    }
    if (onFieldCreated) onFieldCreated(field);
    setAddFieldSection(null);
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

            {/* ── Single scroll container — header scrolls away, tabs stick ── */}
            <div ref={contentRef} className="flex-1 min-h-0 overflow-y-auto drawer-col-scroll">

              {/* Header — scrolls away */}
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="text-lg font-semibold text-gray-900 leading-tight line-clamp-2">{deal.title}</h2>
                </div>
                <div className="mb-3">
                  <PipelineSelector pipelines={pipelines} currentPipelineId={currentPipelineId} onSelect={handlePipelineSelect} loading={stageChanging} />
                </div>
                <StageKanban stages={currentStages} currentStageId={currentStageId} onStageChange={handleStageChange} loading={stageChanging} />
              </div>

              {/* ── Tabs nav — sticky ── */}
              <div ref={tabsRef} className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center px-4 gap-0">
                {TABS.map(tab => (
                  <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                    {tab.icon}{tab.label}
                  </button>
                ))}
                {/* Close button always visible in sticky bar */}
                <button type="button" onClick={onClose} className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0">
                  <X size={18} />
                </button>
              </div>

              {/* ── Tab content ── */}
              <AnimatePresence mode="wait" initial={false}>
                {activeTab === "general" && (
                  <motion.div key="general"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.14, ease: "easeOut" }}
                    className="grid grid-cols-5 divide-x divide-gray-100 min-h-[calc(100vh-200px)]">
                    <div ref={leftColRef} className="col-span-2 p-4">
                      <DetailsLeft
                        deal={deal}
                        customFields={customFields}
                        currentPipelineId={currentPipelineId}
                        pendingSections={pendingSections}
                        onFieldSave={handleFieldSave}
                        onFieldRemove={handleFieldRemove}
                        onFieldUpdate={handleFieldUpdate}
                        onFieldAssign={handleFieldAssign}
                        onOpenContact={openContactDrawer}
                        onAddField={(sec) => setAddFieldSection(sec)}
                        onSelectField={(sec) => setSelectFieldSection(sec)}
                        onCreateSection={() => setCreateSectionOpen(true)}
                        onChooseSection={() => setChooseSectionOpen(true)}
                        onCreateContact={() => setCreateContactOpen(true)}
                      />
                    </div>
                    <div ref={rightColRef} className="col-span-3 p-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Лента активности</p>
                      <ActivityFeed dealId={deal.id} />
                    </div>
                  </motion.div>
                )}
                {activeTab === "tasks" && (
                  <motion.div key="tasks"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.14, ease: "easeOut" }}
                    className="p-4 min-h-[calc(100vh-200px)]">
                    <TaskList dealId={deal.id} />
                  </motion.div>
                )}
                {activeTab === "chat" && (
                  <div key="chat" className="min-h-[calc(100vh-120px)]">
                    <ChatPanel
                      dealId={deal.id}
                      contactPhone={deal.contactPhone}
                      contactName={deal.contactName}
                    />
                  </div>
                )}
                {activeTab === "docs" && (
                  <motion.div key="docs"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.14, ease: "easeOut" }}
                    className="flex flex-col items-center justify-center min-h-[400px] text-gray-400 gap-3">
                    <FileText size={40} strokeWidth={1.25} className="opacity-30" />
                    <p className="text-sm">Документы — в разработке</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── Add Field Modal ── */}
          <AnimatePresence>
            {addFieldSection !== null && (
              <AddFieldModal
                sectionName={addFieldSection}
                onClose={() => setAddFieldSection(null)}
                onCreate={handleFieldCreatedInSection}
              />
            )}
          </AnimatePresence>

          {/* ── Select Field Modal ── */}
          <AnimatePresence>
            {selectFieldSection !== null && (
              <SelectFieldModal
                availableFields={availableForSection}
                onClose={() => setSelectFieldSection(null)}
                onSelect={async (field) => {
                  await handleFieldAssign(field, selectFieldSection);
                  setSelectFieldSection(null);
                }}
              />
            )}
          </AnimatePresence>

          {/* ── Create Section Modal ── */}
          <AnimatePresence>
            {createSectionOpen && (
              <CreateSectionModal
                onClose={() => setCreateSectionOpen(false)}
                onCreate={handleCreateSection}
              />
            )}
          </AnimatePresence>

          {/* ── Choose Section Modal ── */}
          <AnimatePresence>
            {chooseSectionOpen && (
              <ChooseSectionModal
                currentPipelineId={currentPipelineId}
                existingSectionNames={existingSectionNames}
                onClose={() => setChooseSectionOpen(false)}
                onSelect={handleChooseSection}
              />
            )}
          </AnimatePresence>

          {/* ── Create Contact Modal ── */}
          <CreateContactModal
            open={createContactOpen}
            onClose={() => setCreateContactOpen(false)}
            onSave={handleCreateContact}
            title="Новый контакт для сделки"
          />
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
