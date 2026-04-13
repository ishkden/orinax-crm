"use client";

import { useState, useEffect } from "react";
import { getDealHistory, type DealHistoryItem } from "@/app/actions/deal-history";
import { History, Loader2 } from "lucide-react";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function describeEvent(item: DealHistoryItem): { label: string; detail: string | null } {
  const who = item.userName ?? "Неизвестный";

  switch (item.action) {
    case "deal_created":
      return { label: `${who} создал сделку`, detail: item.toValue ? `«${item.toValue}»` : null };
    case "stage_changed":
      if (item.fromValue && item.toValue)
        return { label: `${who} изменил стадию`, detail: `с «${item.fromValue}» на «${item.toValue}»` };
      if (item.toValue)
        return { label: `${who} установил стадию «${item.toValue}»`, detail: null };
      return { label: `${who} изменил стадию`, detail: null };
    case "pipeline_changed":
      if (item.fromValue && item.toValue)
        return { label: `${who} перенёс сделку`, detail: `из воронки «${item.fromValue}» в «${item.toValue}»` };
      if (item.toValue)
        return { label: `${who} перенёс сделку в воронку «${item.toValue}»`, detail: null };
      return { label: `${who} изменил воронку`, detail: null };
    case "value_changed":
      if (item.fromValue && item.toValue)
        return { label: `${who} изменил сумму`, detail: `с ${item.fromValue} на ${item.toValue}` };
      if (item.toValue)
        return { label: `${who} установил сумму ${item.toValue}`, detail: null };
      return { label: `${who} изменил сумму`, detail: null };
    case "assignee_changed":
      if (item.fromValue && item.toValue)
        return { label: `${who} изменил ответственного`, detail: `с «${item.fromValue}» на «${item.toValue}»` };
      if (item.toValue)
        return { label: `${who} назначил ответственного «${item.toValue}»`, detail: null };
      if (item.fromValue)
        return { label: `${who} снял ответственного «${item.fromValue}»`, detail: null };
      return { label: `${who} изменил ответственного`, detail: null };
    case "contact_added":
      return { label: `${who} добавил контакт`, detail: item.toValue ? `«${item.toValue}»` : null };
    case "contact_removed":
      return { label: `${who} отвязал контакт`, detail: item.fromValue ? `«${item.fromValue}»` : null };
    case "field_changed": {
      const fieldLabel = item.field ?? "поле";
      if (item.fromValue && item.toValue)
        return { label: `${who} изменил поле «${fieldLabel}»`, detail: `с «${item.fromValue}» на «${item.toValue}»` };
      if (item.toValue)
        return { label: `${who} заполнил поле «${fieldLabel}»`, detail: `«${item.toValue}»` };
      if (item.fromValue)
        return { label: `${who} очистил поле «${fieldLabel}»`, detail: null };
      return { label: `${who} изменил поле «${fieldLabel}»`, detail: null };
    }
    default:
      return { label: `${who} совершил действие`, detail: item.action };
  }
}

function getActionDot(action: string): string {
  switch (action) {
    case "deal_created": return "bg-green-500";
    case "stage_changed": return "bg-indigo-500";
    case "pipeline_changed": return "bg-purple-500";
    case "value_changed": return "bg-amber-500";
    case "assignee_changed": return "bg-sky-500";
    case "contact_added": return "bg-emerald-500";
    case "contact_removed": return "bg-red-400";
    case "field_changed": return "bg-gray-400";
    default: return "bg-gray-400";
  }
}

export default function DealHistoryTab({ dealId }: { dealId: string }) {
  const [items, setItems] = useState<DealHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDealHistory(dealId).then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, [dealId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
        <History size={36} strokeWidth={1.25} className="opacity-40" />
        <p className="text-sm">История изменений пуста</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-[11px] top-3 bottom-3 w-px bg-gray-100" />

      <div className="space-y-0">
        {items.map((item) => {
          const { label, detail } = describeEvent(item);
          return (
            <div key={item.id} className="flex gap-3 py-2.5 relative">
              {/* Dot */}
              <div className={`w-[9px] h-[9px] rounded-full mt-[5px] shrink-0 z-10 ${getActionDot(item.action)}`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-gray-800 leading-snug">
                  {label}
                  {detail && (
                    <span className="text-gray-500"> {detail}</span>
                  )}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{formatDateTime(item.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
