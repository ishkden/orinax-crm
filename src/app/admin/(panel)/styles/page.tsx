"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Paintbrush,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Columns3,
  CreditCard,
  Type,
  DollarSign,
  UserCircle,
  Footprints,
  Calendar,
  User,
  Move,
  Plus,
  MessageSquare,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import {
  type KanbanStyles,
  defaultKanbanStyles,
  KANBAN_STYLES_KEY,
} from "@/lib/kanban-styles";

type SectionKey = keyof KanbanStyles;

interface FieldDef {
  key: string;
  label: string;
  type: "number" | "color" | "select" | "text" | "toggle";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { value: string; label: string }[];
}

const fontWeightOptions = [
  { value: "300", label: "300 — Light" },
  { value: "400", label: "400 — Normal" },
  { value: "500", label: "500 — Medium" },
  { value: "600", label: "600 — Semibold" },
  { value: "700", label: "700 — Bold" },
  { value: "800", label: "800 — Extrabold" },
];

const lineHeightOptions = [
  { value: "tight", label: "Tight (1.25)" },
  { value: "snug", label: "Snug (1.375)" },
  { value: "normal", label: "Normal (1.5)" },
  { value: "relaxed", label: "Relaxed (1.625)" },
];

const shadowOptions = [
  { value: "none", label: "Нет" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

const sections: {
  key: SectionKey;
  label: string;
  icon: typeof LayoutGrid;
  fields: FieldDef[];
}[] = [
  {
    key: "board",
    label: "Доска",
    icon: LayoutGrid,
    fields: [
      { key: "maxHeight", label: "Макс. высота", type: "number", min: 300, max: 1200, step: 10, unit: "px" },
      { key: "minHeight", label: "Мин. высота", type: "number", min: 200, max: 600, step: 10, unit: "px" },
      { key: "columnGap", label: "Отступ между колонками", type: "number", min: 0, max: 40, step: 1, unit: "px" },
      { key: "paddingX", label: "Отступ слева/справа", type: "number", min: 0, max: 60, step: 2, unit: "px" },
      { key: "paddingTop", label: "Отступ сверху", type: "number", min: 0, max: 40, step: 2, unit: "px" },
      { key: "paddingBottom", label: "Отступ снизу", type: "number", min: 0, max: 40, step: 2, unit: "px" },
      { key: "navStickyHeight", label: "Видимость шапки при прокрутке: отриц. = шапка скрыта с самого начала, 0 = уходит полностью, 48 = остаются вкладки, 96 = + заголовок, 154 = + строка фильтров", type: "number", min: -200, max: 200, step: 8, unit: "px" },
    ],
  },
  {
    key: "column",
    label: "Колонка",
    icon: Columns3,
    fields: [
      { key: "width", label: "Ширина колонки", type: "number", min: 160, max: 400, step: 4, unit: "px" },
      { key: "borderRadius", label: "Скругление углов", type: "number", min: 0, max: 24, step: 1, unit: "px" },
      { key: "backgroundColor", label: "Фон колонки", type: "color" },
      { key: "backgroundOpacity", label: "Прозрачность фона", type: "number", min: 0, max: 100, step: 5, unit: "%" },
      { key: "dragOverBorderColor", label: "Цвет рамки при наведении", type: "color" },
      { key: "dragOverBgColor", label: "Фон при наведении", type: "color" },
      { key: "cardGap", label: "Отступ между карточками", type: "number", min: 0, max: 24, step: 1, unit: "px" },
    ],
  },
  {
    key: "columnHeader",
    label: "Шапка колонки",
    icon: Type,
    fields: [
      { key: "fontSize", label: "Размер текста", type: "number", min: 8, max: 20, step: 1, unit: "px" },
      { key: "fontWeight", label: "Жирность шрифта", type: "select", options: fontWeightOptions },
      { key: "minHeight", label: "Мин. высота", type: "number", min: 20, max: 60, step: 2, unit: "px" },
      { key: "borderRadius", label: "Скругление углов", type: "number", min: 0, max: 24, step: 1, unit: "px" },
      { key: "paddingX", label: "Отступ горизонтальный", type: "number", min: 0, max: 24, step: 1, unit: "px" },
      { key: "paddingY", label: "Отступ вертикальный", type: "number", min: 0, max: 16, step: 1, unit: "px" },
      { key: "countBadgeFontSize", label: "Размер бейджа кол-ва", type: "number", min: 6, max: 16, step: 1, unit: "px" },
      { key: "countBadgePaddingX", label: "Отступ X бейджа", type: "number", min: 0, max: 16, step: 1, unit: "px" },
      { key: "countBadgePaddingY", label: "Отступ Y бейджа", type: "number", min: 0, max: 8, step: 1, unit: "px" },
    ],
  },
  {
    key: "stageTotal",
    label: "Итого по стадии",
    icon: DollarSign,
    fields: [
      { key: "show", label: "Показывать", type: "toggle" },
      { key: "fontSize", label: "Размер текста", type: "number", min: 10, max: 28, step: 1, unit: "px" },
      { key: "fontWeight", label: "Жирность шрифта", type: "select", options: fontWeightOptions },
      { key: "textColor", label: "Цвет текста", type: "color" },
    ],
  },
  {
    key: "card",
    label: "Карточка сделки",
    icon: CreditCard,
    fields: [
      { key: "minHeight", label: "Мин. высота", type: "number", min: 80, max: 400, step: 4, unit: "px" },
      { key: "borderRadius", label: "Скругление углов", type: "number", min: 0, max: 24, step: 1, unit: "px" },
      { key: "backgroundColor", label: "Фон карточки", type: "color" },
      { key: "borderColor", label: "Цвет рамки", type: "color" },
      { key: "hoverBorderColor", label: "Цвет рамки при наведении", type: "color" },
      { key: "hoverShadow", label: "Тень при наведении", type: "select", options: shadowOptions },
      { key: "paddingX", label: "Отступ горизонтальный", type: "number", min: 4, max: 24, step: 1, unit: "px" },
      { key: "paddingY", label: "Отступ вертикальный", type: "number", min: 4, max: 24, step: 1, unit: "px" },
    ],
  },
  {
    key: "cardTitle",
    label: "Заголовок карточки",
    icon: Type,
    fields: [
      { key: "show", label: "Показывать", type: "toggle" },
      { key: "fontSize", label: "Размер текста", type: "number", min: 8, max: 22, step: 1, unit: "px" },
      { key: "fontWeight", label: "Жирность шрифта", type: "select", options: fontWeightOptions },
      { key: "lineHeight", label: "Высота строки", type: "select", options: lineHeightOptions },
      { key: "textColor", label: "Цвет текста", type: "color" },
    ],
  },
  {
    key: "cardValue",
    label: "Сумма сделки",
    icon: DollarSign,
    fields: [
      { key: "show", label: "Показывать", type: "toggle" },
      { key: "fontSize", label: "Размер текста", type: "number", min: 8, max: 28, step: 1, unit: "px" },
      { key: "fontWeight", label: "Жирность шрифта", type: "select", options: fontWeightOptions },
      { key: "textColor", label: "Цвет текста", type: "color" },
      { key: "marginTop", label: "Отступ сверху", type: "number", min: 0, max: 20, step: 1, unit: "px" },
    ],
  },
  {
    key: "cardContact",
    label: "Контакт на карточке",
    icon: UserCircle,
    fields: [
      { key: "show", label: "Показывать", type: "toggle" },
      { key: "fontSize", label: "Размер текста", type: "number", min: 8, max: 20, step: 1, unit: "px" },
      { key: "fontWeight", label: "Жирность шрифта", type: "select", options: fontWeightOptions },
      { key: "textColor", label: "Цвет текста", type: "color" },
      { key: "hoverTextColor", label: "Цвет при наведении", type: "color" },
      { key: "marginTop", label: "Отступ сверху", type: "number", min: 0, max: 20, step: 1, unit: "px" },
    ],
  },
  {
    key: "cardFooter",
    label: "Подвал карточки",
    icon: Footprints,
    fields: [
      { key: "show", label: "Показывать", type: "toggle" },
      { key: "borderColor", label: "Цвет разделителя", type: "color" },
      { key: "paddingTop", label: "Отступ сверху", type: "number", min: 0, max: 24, step: 1, unit: "px" },
      { key: "gap", label: "Отступ между элементами", type: "number", min: 0, max: 20, step: 1, unit: "px" },
    ],
  },
  {
    key: "cardDate",
    label: "Дата закрытия",
    icon: Calendar,
    fields: [
      { key: "show", label: "Показывать", type: "toggle" },
      { key: "fontSize", label: "Размер текста", type: "number", min: 8, max: 18, step: 1, unit: "px" },
      { key: "normalColor", label: "Цвет текста", type: "color" },
      { key: "overdueColor", label: "Цвет просроченных", type: "color" },
      { key: "iconSize", label: "Размер иконки", type: "number", min: 8, max: 20, step: 1, unit: "px" },
    ],
  },
  {
    key: "cardAssignee",
    label: "Аватар ответственного",
    icon: User,
    fields: [
      { key: "show", label: "Показывать", type: "toggle" },
      { key: "size", label: "Размер аватара", type: "number", min: 16, max: 48, step: 2, unit: "px" },
      { key: "backgroundColor", label: "Фон аватара", type: "color" },
      { key: "textColor", label: "Цвет инициалов", type: "color" },
      { key: "fontSize", label: "Размер инициалов", type: "number", min: 6, max: 18, step: 1, unit: "px" },
      { key: "fontWeight", label: "Жирность инициалов", type: "select", options: fontWeightOptions },
    ],
  },
  {
    key: "dragOverlay",
    label: "Перетаскивание",
    icon: Move,
    fields: [
      { key: "width", label: "Ширина оверлея", type: "number", min: 160, max: 400, step: 4, unit: "px" },
      { key: "rotation", label: "Наклон оверлея", type: "number", min: -10, max: 10, step: 1, unit: "°" },
      { key: "opacity", label: "Прозрачность оверлея", type: "number", min: 10, max: 100, step: 5, unit: "%" },
      { key: "draggingRotation", label: "Наклон карточки", type: "number", min: -10, max: 10, step: 1, unit: "°" },
      { key: "draggingOpacity", label: "Прозрачность карточки", type: "number", min: 10, max: 100, step: 5, unit: "%" },
    ],
  },
  {
    key: "addButton",
    label: 'Кнопка "Добавить"',
    icon: Plus,
    fields: [
      { key: "show", label: "Показывать", type: "toggle" },
      { key: "size", label: "Размер кнопки", type: "number", min: 24, max: 56, step: 2, unit: "px" },
      { key: "iconSize", label: "Размер иконки", type: "number", min: 12, max: 32, step: 1, unit: "px" },
      { key: "borderRadius", label: "Скругление углов", type: "number", min: 0, max: 28, step: 1, unit: "px" },
    ],
  },
  {
    key: "emptyState",
    label: "Пустая колонка",
    icon: MessageSquare,
    fields: [
      { key: "text", label: "Текст", type: "text" },
      { key: "fontSize", label: "Размер текста", type: "number", min: 8, max: 18, step: 1, unit: "px" },
      { key: "textColor", label: "Цвет текста", type: "color" },
    ],
  },
];

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (field.type === "toggle") {
    const checked = value as boolean;
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-300">{field.label}</span>
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
            checked ? "bg-brand-600" : "bg-gray-700"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    );
  }

  if (field.type === "color") {
    const hex = value as string;
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-300">{field.label}</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={hex}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded-lg border border-gray-700 cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded"
          />
          <input
            type="text"
            value={hex}
            onChange={(e) => onChange(e.target.value)}
            className="w-[90px] text-xs font-mono bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-gray-300 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-300">{field.label}</span>
        <select
          value={String(value)}
          onChange={(e) => {
            const v = e.target.value;
            onChange(isNaN(Number(v)) ? v : Number(v));
          }}
          className="text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-gray-300 focus:outline-none focus:border-brand-500"
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "text") {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-300 shrink-0 mr-3">{field.label}</span>
        <input
          type="text"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-gray-300 focus:outline-none focus:border-brand-500 w-48"
        />
      </div>
    );
  }

  const num = value as number;
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-300">{field.label}</span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={num}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-16 text-xs text-right font-mono bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-gray-300 focus:outline-none focus:border-brand-500"
          />
          {field.unit && (
            <span className="text-[10px] text-gray-600 w-4">{field.unit}</span>
          )}
        </div>
      </div>
      <input
        type="range"
        value={num}
        min={field.min}
        max={field.max}
        step={field.step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-gray-700 accent-brand-500 cursor-pointer [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
      />
    </div>
  );
}

function SectionPanel({
  section,
  styles,
  onFieldChange,
  open,
  onToggle,
}: {
  section: (typeof sections)[number];
  styles: Record<string, unknown>;
  onFieldChange: (field: string, value: unknown) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = section.icon;
  const hasToggle = section.fields.some((f) => f.key === "show");
  const isVisible = hasToggle ? (styles.show as boolean) !== false : true;

  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors"
      >
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            isVisible ? "bg-brand-600/15 text-brand-400" : "bg-gray-800 text-gray-500"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-sm font-medium text-gray-200 flex-1 text-left">
          {section.label}
        </span>
        {hasToggle && (
          <span className="mr-2">
            {isVisible ? (
              <Eye className="w-3.5 h-3.5 text-brand-400" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-gray-600" />
            )}
          </span>
        )}
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-800 divide-y divide-gray-800/50">
          {section.fields.map((field) => (
            <FieldControl
              key={field.key}
              field={field}
              value={styles[field.key]}
              onChange={(v) => onFieldChange(field.key, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminStylesPage() {
  const [styles, setStyles] = useState<KanbanStyles>(deepClone(defaultKanbanStyles));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/admin/settings?key=${KANBAN_STYLES_KEY}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object" && data.board) {
          const merged = deepClone(defaultKanbanStyles);
          for (const sKey of Object.keys(merged) as SectionKey[]) {
            if (data[sKey] && typeof data[sKey] === "object") {
              Object.assign(merged[sKey], data[sKey]);
            }
          }
          setStyles(merged);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFieldChange = useCallback(
    (sectionKey: SectionKey, field: string, value: unknown) => {
      setStyles((prev) => ({
        ...prev,
        [sectionKey]: { ...prev[sectionKey], [field]: value },
      }));
      setSaved(false);
    },
    []
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: KANBAN_STYLES_KEY, value: styles }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [styles]);

  const handleReset = useCallback(() => {
    if (!confirm("Сбросить все настройки канбана на значения по умолчанию?")) return;
    setStyles(deepClone(defaultKanbanStyles));
    setSaved(false);
  }, []);

  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setOpenSections(new Set(sections.map((s) => s.key)));
  }, []);

  const collapseAll = useCallback(() => {
    setOpenSections(new Set());
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-40" />
          <div className="h-64 bg-gray-800/50 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Стили</h1>
          <p className="text-sm text-gray-500 mt-1">
            Настройка внешнего вида компонентов CRM
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-600/15 flex items-center justify-center">
            <Paintbrush className="w-5 h-5 text-brand-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-white">
              Стиль канбан-доски
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              14 секций · {sections.reduce((a, s) => a + s.fields.length, 0)} параметров
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
            >
              Развернуть
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
            >
              Свернуть
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-2">
          {sections.map((section) => (
            <SectionPanel
              key={section.key}
              section={section}
              styles={styles[section.key] as unknown as Record<string, unknown>}
              onFieldChange={(field, value) =>
                handleFieldChange(section.key, field, value)
              }
              open={openSections.has(section.key)}
              onToggle={() => toggleSection(section.key)}
            />
          ))}
        </div>

        <div className="px-5 py-4 border-t border-gray-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Сбросить по умолчанию
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
              saved
                ? "bg-emerald-600 text-white"
                : "bg-brand-600 text-white hover:bg-brand-700"
            } disabled:opacity-50`}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Сохранено
              </>
            ) : saving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Сохранение…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Сохранить
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
