"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Search,
  Loader2,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface CallRecord {
  id: string;
  direction: "inbound" | "outbound" | "missed";
  callerNumber: string;
  calleeNumber: string;
  startedAt: string;
  duration: number;
  status: string;
  recordingUrl?: string | null;
}

function formatDuration(sec: number): string {
  if (!sec || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11 && d[0] === "7") {
    return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
  }
  return raw || "—";
}

function DirectionBadge({ direction }: { direction: string }) {
  if (direction === "inbound") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
        <PhoneIncoming size={11} />
        Входящий
      </span>
    );
  }
  if (direction === "outbound") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
        <PhoneOutgoing size={11} />
        Исходящий
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-600 border border-red-100">
      <PhoneMissed size={11} />
      Пропущен
    </span>
  );
}

type Filter = "all" | "inbound" | "outbound" | "missed";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "inbound", label: "Входящие" },
  { value: "outbound", label: "Исходящие" },
  { value: "missed", label: "Пропущенные" },
];

export default function TelephonyCallsPage() {
  const [loading, setLoading] = useState(true);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mcn/calls?page=${page}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setCalls(data.calls ?? []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  const filtered = calls.filter((c) => {
    if (filter !== "all" && c.direction !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.callerNumber?.includes(q) || c.calleeNumber?.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 p-1 bg-gray-100/80 rounded-lg">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPage(1); }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                filter === f.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-56">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по номеру..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface-raised shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Тип</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Откуда</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Куда</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Дата</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-400">Длительность</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-400">Запись</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-5 w-20 bg-gray-100 rounded-full" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-28 bg-gray-100 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-28 bg-gray-100 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-28 bg-gray-100 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-12 bg-gray-100 rounded ml-auto" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-14 bg-gray-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <PhoneCall size={24} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-sm text-text-secondary">
                      {calls.length === 0 ? "Звонков пока нет" : "Нет звонков по фильтру"}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">
                      {calls.length === 0
                        ? "Записи появятся после первого звонка"
                        : "Попробуйте изменить параметры поиска"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-2.5"><DirectionBadge direction={c.direction} /></td>
                    <td className="px-4 py-2.5 font-mono text-sm text-text-primary">{formatPhone(c.callerNumber)}</td>
                    <td className="px-4 py-2.5 font-mono text-sm text-text-primary">{formatPhone(c.calleeNumber)}</td>
                    <td className="px-4 py-2.5 text-sm text-text-secondary">
                      {new Date(c.startedAt).toLocaleString("ru-RU", {
                        day: "2-digit", month: "short",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-mono text-text-primary text-right">
                      {formatDuration(c.duration)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {c.recordingUrl ? (
                        <a
                          href={c.recordingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-100 transition-colors"
                        >
                          <Play size={10} fill="currentColor" />
                          Запись
                        </a>
                      ) : (
                        <span className="text-xs text-text-tertiary">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
