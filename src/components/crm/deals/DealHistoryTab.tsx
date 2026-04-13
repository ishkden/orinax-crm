"use client";

import { useState, useEffect, useCallback } from "react";
import { getDealHistory, type DealHistoryItem } from "@/app/actions/deal-history";
import {
  History, Loader2, ChevronLeft, ChevronRight,
  ArrowRightLeft, DollarSign, UserCheck, GitBranch,
  UserPlus, UserMinus, SlidersHorizontal, Sparkles,
} from "lucide-react";

const PAGE_SIZE = 50;

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
  };
}

type EventStyle = {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  detail: string | null;
};

function getEventStyle(item: DealHistoryItem): EventStyle {
  const who = item.userName ?? "Неизвестный";

  switch (item.action) {
    case "deal_created":
      return {
        icon: <Sparkles size={13} />,
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        label: `${who} создал сделку`,
        detail: item.toValue ? `«${item.toValue}»` : null,
      };
    case "stage_changed":
      return {
        icon: <ArrowRightLeft size={13} />,
        iconBg: "bg-indigo-100",
        iconColor: "text-indigo-600",
        label: `${who} изменил стадию`,
        detail: item.fromValue && item.toValue
          ? `«${item.fromValue}» → «${item.toValue}»`
          : item.toValue ? `→ «${item.toValue}»` : null,
      };
    case "pipeline_changed":
      return {
        icon: <GitBranch size={13} />,
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600",
        label: `${who} изменил воронку`,
        detail: item.fromValue && item.toValue
          ? `«${item.fromValue}» → «${item.toValue}»`
          : item.toValue ? `→ «${item.toValue}»` : null,
      };
    case "value_changed":
      return {
        icon: <DollarSign size={13} />,
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        label: `${who} изменил сумму`,
        detail: item.fromValue && item.toValue
          ? `${item.fromValue} → ${item.toValue}`
          : item.toValue ? `→ ${item.toValue}` : null,
      };
    case "assignee_changed":
      return {
        icon: <UserCheck size={13} />,
        iconBg: "bg-sky-100",
        iconColor: "text-sky-600",
        label: `${who} изменил ответственного`,
        detail: item.fromValue && item.toValue
          ? `«${item.fromValue}» → «${item.toValue}»`
          : item.toValue ? `→ «${item.toValue}»`
          : item.fromValue ? `убран «${item.fromValue}»` : null,
      };
    case "contact_added":
      return {
        icon: <UserPlus size={13} />,
        iconBg: "bg-teal-100",
        iconColor: "text-teal-600",
        label: `${who} добавил контакт`,
        detail: item.toValue ? `«${item.toValue}»` : null,
      };
    case "contact_removed":
      return {
        icon: <UserMinus size={13} />,
        iconBg: "bg-rose-100",
        iconColor: "text-rose-500",
        label: `${who} отвязал контакт`,
        detail: item.fromValue ? `«${item.fromValue}»` : null,
      };
    case "field_changed":
      return {
        icon: <SlidersHorizontal size={13} />,
        iconBg: "bg-gray-100",
        iconColor: "text-gray-500",
        label: `${who} изменил «${item.field ?? "поле"}»`,
        detail: item.fromValue && item.toValue
          ? `«${item.fromValue}» → «${item.toValue}»`
          : item.toValue ? `→ «${item.toValue}»`
          : item.fromValue ? `очищено` : null,
      };
    default:
      return {
        icon: <History size={13} />,
        iconBg: "bg-gray-100",
        iconColor: "text-gray-400",
        label: `${who} совершил действие`,
        detail: item.action,
      };
  }
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function avatarColor(name: string | null): string {
  const colors = [
    "bg-violet-100 text-violet-700",
    "bg-blue-100 text-blue-700",
    "bg-teal-100 text-teal-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-indigo-100 text-indigo-700",
    "bg-emerald-100 text-emerald-700",
    "bg-pink-100 text-pink-700",
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return colors[hash % colors.length];
}

function HistoryItem({ item }: { item: DealHistoryItem }) {
  const ev = getEventStyle(item);
  const { date, time } = formatDateTime(item.createdAt);

  return (
    <div className="flex gap-3 group">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        {item.userImage ? (
          <img
            src={item.userImage}
            alt={item.userName ?? ""}
            className="w-8 h-8 rounded-full object-cover border border-gray-100 shadow-sm"
          />
        ) : (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold ${avatarColor(item.userName)}`}
          >
            {getInitials(item.userName)}
          </div>
        )}
      </div>

      {/* Card */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 shadow-sm group-hover:shadow-md group-hover:border-gray-200 transition-all duration-150">
          {/* Top row: icon badge + text */}
          <div className="flex items-start gap-2.5">
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg shrink-0 mt-px ${ev.iconBg} ${ev.iconColor}`}>
              {ev.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-gray-800 leading-snug">{ev.label}</p>
              {ev.detail && (
                <p className="text-[12px] text-gray-500 mt-0.5 leading-snug break-words">{ev.detail}</p>
              )}
            </div>
          </div>

          {/* Bottom: date & time */}
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-50">
            <span className="text-[11px] text-gray-400">{date}</span>
            <span className="text-gray-200">·</span>
            <span className="text-[11px] text-gray-400">{time}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DealHistoryTab({ dealId }: { dealId: string }) {
  const [items, setItems] = useState<DealHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await getDealHistory(dealId, p, PAGE_SIZE);
        setItems(result.items);
        setTotal(result.total);
      } catch (e) {
        setError("Не удалось загрузить историю");
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [dealId]
  );

  useEffect(() => {
    setPage(1);
    load(1);
  }, [dealId, load]);

  function goToPage(p: number) {
    setPage(p);
    load(p);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <Loader2 size={22} className="animate-spin" />
        <p className="text-sm">Загрузка истории…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-2">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={() => load(page)}
          className="text-xs text-brand-600 hover:underline"
        >
          Повторить
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
          <History size={26} strokeWidth={1.5} className="opacity-50" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500">История пуста</p>
          <p className="text-xs text-gray-400 mt-1">
            Изменения в сделке будут отображаться здесь
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {total} {total === 1 ? "событие" : total < 5 ? "события" : "событий"}
        </p>
        {totalPages > 1 && (
          <p className="text-xs text-gray-400">
            стр. {page} / {totalPages}
          </p>
        )}
      </div>

      {/* Timeline */}
      <div className="relative px-4">
        <div className="space-y-0">
          {items.map((item) => (
            <HistoryItem key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-100 px-4">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={13} /> Назад
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "…" ? (
                  <span key={`el-${idx}`} className="px-1 text-xs text-gray-300">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p as number)}
                    className={`w-7 h-7 text-xs rounded-lg transition-colors font-medium ${
                      page === p
                        ? "bg-brand-600 text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
          </div>

          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Вперёд <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
