"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import type { CustomFieldDef, CustomFieldType } from "@/app/actions/custom-fields";

// ─── Value editor ─────────────────────────────────────────────────────────────

function FieldEditor({
  field,
  value,
  onSave,
  onCancel,
}: {
  field: CustomFieldDef;
  value: unknown;
  onSave: (v: unknown) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(() => {
    if (field.type === "BOOLEAN") return value ?? false;
    if (field.type === "MONEY") {
      const m = value as { amount?: number; currency?: string } | null;
      return m ? JSON.stringify(m) : '{"amount":0,"currency":"RUB"}';
    }
    if (field.type === "LIST") {
      const arr = Array.isArray(value) ? value : value ? [value] : [];
      return arr.join(", ");
    }
    return value != null ? String(value) : "";
  });

  function handleSave() {
    let parsed: unknown = draft;
    if (field.type === "NUMBER") parsed = draft !== "" ? Number(draft) : null;
    else if (field.type === "BOOLEAN") parsed = draft;
    else if (field.type === "MONEY") {
      try { parsed = JSON.parse(draft as string); } catch { parsed = null; }
    } else if (field.type === "LIST") {
      parsed = (draft as string).split(",").map((s) => s.trim()).filter(Boolean);
    }
    onSave(parsed);
  }

  if (field.type === "BOOLEAN") {
    return (
      <div className="flex items-center gap-3">
        <div
          onClick={() => setDraft((v) => !v)}
          className={`relative w-9 h-5 rounded-full cursor-pointer transition-colors ${
            draft ? "bg-brand-600" : "bg-gray-200"
          }`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${draft ? "translate-x-4" : ""}`} />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Сохранить</button>
          <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600">Отмена</button>
        </div>
      </div>
    );
  }

  if (field.type === "LIST" && field.options && field.options.length > 0) {
    const selected = Array.isArray(value) ? value as string[] : value ? [String(value)] : [];
    return (
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1.5">
          {field.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                const arr = selected.includes(opt)
                  ? selected.filter((s) => s !== opt)
                  : [...selected, opt];
                setDraft(arr.join(", "));
              }}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                selected.includes(opt)
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={handleSave} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Сохранить</button>
          <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600">Отмена</button>
        </div>
      </div>
    );
  }

  if (field.type === "TEXT") {
    return (
      <div className="space-y-1.5">
        <textarea
          autoFocus
          value={draft as string}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
        />
        <div className="flex gap-2">
          <button onClick={handleSave} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Сохранить</button>
          <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600">Отмена</button>
        </div>
      </div>
    );
  }

  const inputType = field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : field.type === "DATETIME" ? "datetime-local" : "text";

  return (
    <div className="space-y-1.5">
      <input
        autoFocus
        type={inputType}
        value={draft as string}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); handleSave(); }
          if (e.key === "Escape") onCancel();
        }}
        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
      />
      <div className="flex gap-2">
        <button onClick={handleSave} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Сохранить</button>
        <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600">Отмена</button>
      </div>
    </div>
  );
}

function formatFieldValue(value: unknown, type: CustomFieldType): string {
  if (value === null || value === undefined || value === "") return "—";
  switch (type) {
    case "BOOLEAN": return value ? "Да" : "Нет";
    case "DATE": return value ? new Date(value as string).toLocaleDateString("ru-RU") : "—";
    case "DATETIME": return value ? new Date(value as string).toLocaleString("ru-RU") : "—";
    case "MONEY": {
      const m = value as { amount?: number; currency?: string };
      if (!m?.amount && m?.amount !== 0) return "—";
      try {
        return new Intl.NumberFormat("ru-RU", { style: "currency", currency: m.currency ?? "RUB", maximumFractionDigits: 0 }).format(m.amount);
      } catch { return `${m.amount} ${m.currency ?? "RUB"}`; }
    }
    case "LIST": {
      const arr = Array.isArray(value) ? value : [value];
      return arr.filter(Boolean).join(", ") || "—";
    }
    default: return String(value);
  }
}

function FieldRow({
  field,
  value,
  onSave,
}: {
  field: CustomFieldDef;
  value: unknown;
  onSave: (code: string, value: unknown) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  function handleSave(v: unknown) {
    startTransition(async () => {
      await onSave(field.code, v);
      setEditing(false);
    });
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{field.name}</p>
        {editing ? (
          <FieldEditor
            field={field}
            value={value}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-gray-800 text-left hover:text-brand-600 transition-colors"
          >
            {formatFieldValue(value, field.type)}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

export default function EntityCustomFieldsBlock({
  fields,
  values,
  onSave,
  settingsHref = "/crm/settings/custom-fields",
}: {
  fields: CustomFieldDef[];
  values: Record<string, unknown>;
  onSave: (code: string, value: unknown) => Promise<void>;
  settingsHref?: string;
}) {
  const [expanded, setExpanded] = useState(true);

  if (fields.length === 0) {
    return (
      <div className="mt-4">
        <Link
          href={settingsHref}
          className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-700 px-4 py-3 text-sm text-zinc-500 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
        >
          <SlidersHorizontal size={14} className="shrink-0" />
          <span>Добавить пользовательские поля</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full text-xs text-zinc-500 uppercase tracking-wider mb-2 hover:text-zinc-300 transition-colors"
      >
        <span>Доп. поля ({fields.length})</span>
        <div className="flex items-center gap-1">
          <Link
            href={settingsHref}
            onClick={(e) => e.stopPropagation()}
            className="p-0.5 hover:text-indigo-400 transition-colors"
            title="Настроить поля"
          >
            <SlidersHorizontal size={11} />
          </Link>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </button>
      {expanded && (
        <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 divide-y divide-zinc-700/30 overflow-hidden">
          {fields.map((f) => (
            <FieldRow
              key={f.id}
              field={f}
              value={values[f.code] ?? null}
              onSave={onSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
