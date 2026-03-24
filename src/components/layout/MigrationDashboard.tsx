"use client";

import { useEffect, useRef, useState } from "react";
import { X, Database, PlayCircle, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  triggerMigration,
  fetchMigrationStatus,
  getSessionOrgId,
  type MigrationStats,
} from "@/app/actions/migration";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage =
  | "IDLE"
  | "COMPANIES"
  | "CONTACTS"
  | "DEALS"
  | "MESSAGES"
  | "DONE"
  | "ERROR";

type UIStatus = "idle" | "running" | "done" | "error";

interface LogLine {
  ts: string;
  text: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RUNNING_STAGES: Stage[] = ["COMPANIES", "CONTACTS", "DEALS", "MESSAGES"];

function stageToStatus(stage: Stage | null): UIStatus {
  if (!stage || stage === "IDLE") return "idle";
  if (stage === "DONE") return "done";
  if (stage === "ERROR") return "error";
  return "running";
}

function stageLabel(stage: Stage | null): string {
  switch (stage) {
    case "COMPANIES":
      return "Компании";
    case "CONTACTS":
      return "Контакты";
    case "DEALS":
      return "Сделки";
    case "MESSAGES":
      return "Сообщения";
    case "DONE":
      return "Завершено";
    case "ERROR":
      return "Ошибка";
    default:
      return "Ожидание";
  }
}

function now(): string {
  return new Date().toLocaleTimeString("ru-RU", { hour12: false });
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}мс`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}с`;
  return `${Math.floor(ms / 60000)}м ${Math.floor((ms % 60000) / 1000)}с`;
}

const STAT_LABELS: Record<keyof MigrationStats, string> = {
  companies: "Компании",
  contacts: "Контакты",
  deals: "Сделки",
  messages: "Сообщения",
};

const STAT_COLORS: Record<keyof MigrationStats, string> = {
  companies: "bg-blue-500",
  contacts: "bg-violet-500",
  deals: "bg-amber-500",
  messages: "bg-emerald-500",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MigrationDashboard({ open, onClose }: Props) {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [uiStatus, setUiStatus] = useState<UIStatus>("idle");
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);
  const [stats, setStats] = useState<MigrationStats>({
    companies: 0,
    contacts: 0,
    deals: 0,
    messages: 0,
  });
  const [elapsedMs, setElapsedMs] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [launching, setLaunching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStageRef = useRef<Stage | null>(null);
  const prevStatsRef = useRef<MigrationStats>({ companies: 0, contacts: 0, deals: 0, messages: 0 });

  // Resolve orgId once
  useEffect(() => {
    getSessionOrgId().then(setOrgId).catch(() => null);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Polling
  useEffect(() => {
    if (!orgId) return;

    const poll = async () => {
      const status = await fetchMigrationStatus(orgId);
      if (!status) return;

      const stage = (status.stage || "IDLE") as Stage;
      const newStatus = stageToStatus(stage);

      setCurrentStage(stage);
      setUiStatus(newStatus);
      setStats(status.stats ?? { companies: 0, contacts: 0, deals: 0, messages: 0 });
      setElapsedMs(status.elapsedMs ?? 0);

      // Append log lines when stage changes or counts grow
      const prev = prevStageRef.current;
      const prevStats = prevStatsRef.current;

      if (stage !== prev && RUNNING_STAGES.includes(stage)) {
        addLog(`Этап: ${stageLabel(stage)} — начат`);
      }

      const s = status.stats ?? { companies: 0, contacts: 0, deals: 0, messages: 0 };
      (Object.keys(STAT_LABELS) as (keyof MigrationStats)[]).forEach((key) => {
        if (s[key] !== prevStats[key] && s[key] > 0) {
          addLog(`${STAT_LABELS[key]}: обработано ${s[key].toLocaleString("ru-RU")}`);
        }
      });

      if (stage === "DONE" && prev !== "DONE") {
        addLog(`Синхронизация завершена за ${formatMs(status.elapsedMs ?? 0)}`);
      }

      prevStageRef.current = stage;
      prevStatsRef.current = s;

      if (newStatus !== "running") {
        stopPolling();
      }
    };

    const startPolling = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(poll, 3000);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (uiStatus === "running") {
      startPolling();
      poll();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiStatus, orgId]);

  function addLog(text: string) {
    setLogs((prev) => [...prev, { ts: now(), text }]);
  }

  async function handleStart() {
    if (!orgId || launching) return;
    setLaunching(true);
    setErrorMsg(null);
    setLogs([]);
    prevStageRef.current = null;
    prevStatsRef.current = { companies: 0, contacts: 0, deals: 0, messages: 0 };

    addLog("Запуск синхронизации...");

    const result = await triggerMigration(orgId);

    if (!result.ok) {
      setErrorMsg(result.message ?? "Неизвестная ошибка");
      setUiStatus("error");
      addLog(`Ошибка: ${result.message ?? "Неизвестная ошибка"}`);
      setLaunching(false);
      return;
    }

    addLog("Запрос принят. Ожидаем статус...");
    setUiStatus("running");
    setLaunching(false);
  }

  // Compute bar widths relative to max stat
  const maxStat = Math.max(
    stats.companies,
    stats.contacts,
    stats.deals,
    stats.messages,
    1
  );

  const isActive = uiStatus === "running";
  const canStart = uiStatus === "idle" || uiStatus === "done" || uiStatus === "error";

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600">
              <Database size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Синхронизация данных
              </h2>
              <p className="text-xs text-gray-400">Миграция из сервиса Аналитики</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Status + Launch */}
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
            <StatusBadge status={uiStatus} stage={currentStage} />

            {elapsedMs > 0 && uiStatus === "running" && (
              <span className="text-xs text-gray-400">{formatMs(elapsedMs)}</span>
            )}

            {canStart && (
              <button
                onClick={handleStart}
                disabled={launching || !orgId}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors",
                  launching || !orgId
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                )}
              >
                {launching ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <PlayCircle size={15} />
                )}
                {launching ? "Запуск..." : "Запустить синхронизацию"}
              </button>
            )}

            {isActive && (
              <button
                disabled
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white bg-green-400 cursor-not-allowed"
              >
                <Loader2 size={15} className="animate-spin" />
                Выполняется...
              </button>
            )}
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Stats */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Статистика
            </p>
            <div className="space-y-3">
              {(Object.keys(STAT_LABELS) as (keyof MigrationStats)[]).map((key) => {
                const value = stats[key];
                const pct = Math.round((value / maxStat) * 100);
                return (
                  <div key={key}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm text-gray-600">{STAT_LABELS[key]}</span>
                      <span className="text-sm font-semibold tabular-nums text-gray-900">
                        {value.toLocaleString("ru-RU")}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-700",
                          STAT_COLORS[key]
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Elapsed (done state) */}
          {uiStatus === "done" && elapsedMs > 0 && (
            <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
              Синхронизация завершена за{" "}
              <span className="font-semibold">{formatMs(elapsedMs)}</span>
            </div>
          )}
        </div>

        {/* Terminal logs */}
        <div className="shrink-0 border-t border-gray-100">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
            <span className="text-xs font-mono text-gray-400">лог синхронизации</span>
            {logs.length > 0 && (
              <button
                onClick={() => setLogs([])}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                очистить
              </button>
            )}
          </div>
          <div className="h-44 overflow-y-auto bg-gray-950 px-4 py-3 font-mono text-xs leading-relaxed">
            {logs.length === 0 ? (
              <span className="text-gray-600">Логи появятся после запуска синхронизации...</span>
            ) : (
              logs.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <span className="shrink-0 text-gray-500">[{l.ts}]</span>
                  <span className="text-green-400">{l.text}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, stage }: { status: UIStatus; stage: Stage | null }) {
  if (status === "idle") {
    return (
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-gray-300" />
        <span className="text-sm text-gray-500">Ожидание</span>
      </div>
    );
  }

  if (status === "running") {
    return (
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        <span className="text-sm font-medium text-gray-700">
          В процессе
          {stage && stage !== "IDLE" && (
            <span className="ml-1.5 font-normal text-gray-400">
              — {stageLabel(stage)}
            </span>
          )}
        </span>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 size={16} />
        <span className="text-sm font-medium">Завершено</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-red-500">
      <AlertCircle size={16} />
      <span className="text-sm font-medium">Ошибка</span>
    </div>
  );
}
