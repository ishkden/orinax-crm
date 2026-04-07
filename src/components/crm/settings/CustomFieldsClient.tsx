"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronLeft,
  GripVertical,
  Type,
  AlignLeft,
  List,
  Calendar,
  Clock,
  MapPin,
  Link2,
  Paperclip,
  DollarSign,
  ToggleLeft,
  Hash,
  CalendarRange,
  Copy,
  Handshake,
  User,
  Building2,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import {
  createCustomField,
  updateCustomField,
  deleteCustomField,
  type CustomFieldDef,
  type CustomFieldType,
  type CustomFieldEntityType,
} from "@/app/actions/custom-fields";

// ─── Entity tabs ──────────────────────────────────────────────────────────────

const ENTITY_TABS: {
  value: CustomFieldEntityType;
  label: string;
  icon: React.ReactNode;
  emptyLabel: string;
  emptyDesc: string;
}[] = [
  {
    value: "DEAL",
    label: "Сделки",
    icon: <Handshake size={14} />,
    emptyLabel: "Нет полей для сделок",
    emptyDesc: "Создайте поля — они появятся в карточке каждой сделки",
  },
  {
    value: "CONTACT",
    label: "Контакты",
    icon: <User size={14} />,
    emptyLabel: "Нет полей для контактов",
    emptyDesc: "Создайте поля — они появятся в карточке каждого контакта",
  },
  {
    value: "COMPANY",
    label: "Компании",
    icon: <Building2 size={14} />,
    emptyLabel: "Нет полей для компаний",
    emptyDesc: "Создайте поля — они появятся в карточке каждой компании",
  },
  {
    value: "LEAD",
    label: "Лиды",
    icon: <UserCheck size={14} />,
    emptyLabel: "Нет полей для лидов",
    emptyDesc: "Создайте поля — они появятся в карточке каждого лида",
  },
];

// ─── Field type definitions ───────────────────────────────────────────────────

const FIELD_TYPES: {
  value: CustomFieldType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: "STRING",
    label: "Строка",
    description: "Текст, символы или числа в одну строку",
    icon: <Type size={16} />,
    color: "text-blue-500 bg-blue-50",
  },
  {
    value: "TEXT",
    label: "Текстовое поле",
    description: "Многострочный текст с описательной информацией",
    icon: <AlignLeft size={16} />,
    color: "text-indigo-500 bg-indigo-50",
  },
  {
    value: "LIST",
    label: "Список",
    description: "Выбор одного или нескольких значений из заданного списка",
    icon: <List size={16} />,
    color: "text-violet-500 bg-violet-50",
  },
  {
    value: "DATETIME",
    label: "Дата/Время",
    description: "Дата и время с помощью встроенного календаря",
    icon: <Clock size={16} />,
    color: "text-amber-500 bg-amber-50",
  },
  {
    value: "DATE",
    label: "Дата",
    description: "Только дата с помощью встроенного календаря",
    icon: <Calendar size={16} />,
    color: "text-orange-500 bg-orange-50",
  },
  {
    value: "RESOURCE",
    label: "Бронирование ресурсов",
    description: "Бронирование ресурса на определённый промежуток времени",
    icon: <CalendarRange size={16} />,
    color: "text-cyan-500 bg-cyan-50",
  },
  {
    value: "ADDRESS",
    label: "Адрес",
    description: "Хранение информации об адресах",
    icon: <MapPin size={16} />,
    color: "text-green-500 bg-green-50",
  },
  {
    value: "URL",
    label: "Ссылка",
    description: "Ссылка на веб-страницу или ресурс",
    icon: <Link2 size={16} />,
    color: "text-sky-500 bg-sky-50",
  },
  {
    value: "FILE",
    label: "Файл",
    description: "Изображения и документы",
    icon: <Paperclip size={16} />,
    color: "text-slate-500 bg-slate-50",
  },
  {
    value: "MONEY",
    label: "Деньги",
    description: "Денежные показатели с указанием валюты",
    icon: <DollarSign size={16} />,
    color: "text-emerald-500 bg-emerald-50",
  },
  {
    value: "BOOLEAN",
    label: "Да/Нет",
    description: "Однозначный ответ «да» или «нет»",
    icon: <ToggleLeft size={16} />,
    color: "text-pink-500 bg-pink-50",
  },
  {
    value: "NUMBER",
    label: "Число",
    description: "Числовые данные для аналитики и отчётов",
    icon: <Hash size={16} />,
    color: "text-rose-500 bg-rose-50",
  },
];

function getTypeMeta(type: CustomFieldType) {
  return FIELD_TYPES.find((t) => t.value === type) ?? FIELD_TYPES[0];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldTypePicker({
  value,
  onChange,
}: {
  value: CustomFieldType;
  onChange: (t: CustomFieldType) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {FIELD_TYPES.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all ${
            value === t.value
              ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
              : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
          }`}
        >
          <span className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${t.color}`}>
            {t.icon}
          </span>
          <div>
            <p className="text-sm font-medium text-gray-900 leading-tight">{t.label}</p>
            <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{t.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function ListOptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (opts: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function addOption() {
    const v = draft.trim();
    if (!v || options.includes(v)) return;
    onChange([...options, v]);
    setDraft("");
  }

  function removeOption(i: number) {
    onChange(options.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Значения списка</p>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
          placeholder="Введите значение и нажмите Enter"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="button"
          onClick={addOption}
          className="px-3 py-2 rounded-lg bg-brand-50 text-brand-600 text-sm font-medium hover:bg-brand-100 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
      {options.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {options.map((opt, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg"
            >
              {opt}
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Add/Edit Field Modal ─────────────────────────────────────────────────────

function FieldForm({
  initial,
  entityType,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: Partial<CustomFieldDef>;
  entityType: CustomFieldEntityType;
  onSave: (data: { name: string; type: CustomFieldType; options: string[]; required: boolean }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<CustomFieldType>(initial?.type ?? "STRING");
  const [options, setOptions] = useState<string[]>(initial?.options ?? []);
  const [required, setRequired] = useState(initial?.required ?? false);
  const isEdit = !!initial?.id;

  const entityTab = ENTITY_TABS.find((e) => e.value === entityType)!;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, type, options, required });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Entity badge */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 w-fit text-xs text-gray-500">
        {entityTab.icon}
        <span>{entityTab.label}</span>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
          Название поля
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например: Источник лида"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Type */}
      {!isEdit && (
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            Тип поля
          </label>
          <FieldTypePicker value={type} onChange={setType} />
        </div>
      )}

      {/* List options */}
      {type === "LIST" && (
        <ListOptionsEditor options={options} onChange={setOptions} />
      )}

      {/* Required */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <div
          onClick={() => setRequired(!required)}
          className={`relative w-9 h-5 rounded-full transition-colors ${
            required ? "bg-brand-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              required ? "translate-x-4" : ""
            }`}
          />
        </div>
        <span className="text-sm text-gray-700">Обязательное поле</span>
      </label>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          <Check size={15} />
          {isPending ? "Сохранение..." : isEdit ? "Сохранить" : "Создать поле"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

// ─── Field Row ────────────────────────────────────────────────────────────────

function FieldRow({
  field,
  onEdit,
  onDelete,
}: {
  field: CustomFieldDef;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const meta = getTypeMeta(field.type);

  function copyCode() {
    navigator.clipboard.writeText(field.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors group">
      <GripVertical size={14} className="text-gray-300 shrink-0 cursor-grab" />

      {/* Type icon */}
      <span className={`shrink-0 rounded-lg p-1.5 ${meta.color}`}>{meta.icon}</span>

      {/* Name + code */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">{field.name}</p>
          {field.required && (
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">обяз.</span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <p className="text-[11px] text-gray-400 font-mono">{field.code}</p>
          <button
            type="button"
            onClick={copyCode}
            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 transition-all"
            title="Скопировать код"
          >
            {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
          </button>
        </div>
      </div>

      {/* Type label */}
      <span className="hidden sm:inline-block text-xs text-gray-400 shrink-0">{meta.label}</span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          title="Редактировать"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Удалить"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomFieldsClient({
  initialFields,
}: {
  initialFields: CustomFieldDef[];
}) {
  const [activeEntity, setActiveEntity] = useState<CustomFieldEntityType>("DEAL");
  const [allFields, setAllFields] = useState<CustomFieldDef[]>(initialFields);
  const [showAdd, setShowAdd] = useState(false);
  const [editField, setEditField] = useState<CustomFieldDef | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const fields = allFields.filter((f) => f.entityType === activeEntity);
  const activeTab = ENTITY_TABS.find((t) => t.value === activeEntity)!;

  function handleAdd(data: { name: string; type: CustomFieldType; options: string[]; required: boolean }) {
    setError(null);
    startTransition(async () => {
      try {
        const created = await createCustomField({ ...data, entityType: activeEntity });
        setAllFields((prev) => [...prev, created]);
        setShowAdd(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка создания");
      }
    });
  }

  function handleEdit(data: { name: string; type: CustomFieldType; options: string[]; required: boolean }) {
    if (!editField) return;
    setError(null);
    startTransition(async () => {
      try {
        const updated = await updateCustomField(editField.id, {
          name: data.name,
          options: data.options,
          required: data.required,
        });
        setAllFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
        setEditField(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка обновления");
      }
    });
  }

  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      try {
        await deleteCustomField(id);
        setAllFields((prev) => prev.filter((f) => f.id !== id));
        setDeleteId(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка удаления");
      }
    });
  }

  const panelOpen = showAdd || editField !== null;

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/crm/settings"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={16} />
          Настройки
        </Link>
        <span className="text-gray-200">/</span>
        <h1 className="text-sm font-medium text-gray-900">Пользовательские поля</h1>
      </div>

      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Пользовательские поля</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Настройте дополнительные поля для каждого типа сущностей
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setShowAdd(true); setEditField(null); }}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          <Plus size={15} />
          Добавить поле
        </button>
      </div>

      {/* Entity tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-gray-100 rounded-xl w-fit">
        {ENTITY_TABS.map((tab) => {
          const count = allFields.filter((f) => f.entityType === tab.value).length;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => { setActiveEntity(tab.value); setShowAdd(false); setEditField(null); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeEntity === tab.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
              {count > 0 && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  activeEntity === tab.value ? "bg-brand-100 text-brand-700" : "bg-gray-200 text-gray-500"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-6">
        {/* Fields list */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
            {fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-3">
                  <Hash size={20} className="text-teal-500" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">{activeTab.emptyLabel}</p>
                <p className="text-xs text-gray-400 max-w-xs">
                  {activeTab.emptyDesc}
                </p>
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="mt-4 flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Plus size={14} />
                  Добавить первое поле
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {fields.map((f) => (
                  <FieldRow
                    key={f.id}
                    field={f}
                    onEdit={() => { setEditField(f); setShowAdd(false); }}
                    onDelete={() => setDeleteId(f.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {fields.length > 0 && (
            <p className="mt-3 text-xs text-gray-400 text-center">
              {fields.length} {fields.length === 1 ? "поле" : fields.length < 5 ? "поля" : "полей"}
            </p>
          )}
        </div>

        {/* Add/Edit panel */}
        {panelOpen && (
          <div className="w-[420px] shrink-0">
            <div className="sticky top-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-gray-900">
                  {editField ? "Редактировать поле" : "Новое поле"}
                </h3>
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setEditField(null); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
              <FieldForm
                initial={editField ?? undefined}
                entityType={activeEntity}
                onSave={editField ? handleEdit : handleAdd}
                onCancel={() => { setShowAdd(false); setEditField(null); }}
                isPending={isPending}
              />
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Удалить поле?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Значения этого поля во всех записях будут удалены. Это действие нельзя отменить.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                disabled={isPending}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Удаление..." : "Удалить"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
