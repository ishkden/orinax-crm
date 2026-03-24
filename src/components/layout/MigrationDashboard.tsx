"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Database,
  PlayCircle,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  startMigration,
  getMigrationStatus,
  type MigrationTaskStatus,
  type MigrationStage,
  type MigrationStatusResponse,
} from "@/app/actions/migration";

// ─── Constants ────────────────────────────────────────────────────────────────

const PIPELINE_STAGES: MigrationStage[] = [
  "COMPANIES",
  "CONTACTS",
  "CHANNELS",
  "DEALS",
  "LEADS",
  "MESSAGES",
];

const STAGE_LABELS: Record<MigrationStage, string> = {
  COMPANIES: "Компании",
  CONTACTS: "Контакты",
  CHANNELS: "Каналы",
  DEALS: "Сделки",
  LEADS: "Лиды",
  MESSAGES: "Сообщения",
  DONE: "Завершено",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMs(ms: number): string {
  if (ms < 1_000) return `${ms}мс`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}с`;
  return `${Math.floor(ms / 60_000)}м ${Math.floor((ms % 60_000) / 1000)}с`;
}

function now(): string {
  return new Date().toLocaleTimeString("ru-RU", { hour12: false });
}

function isActiveStatus(status: MigrationTaskStatus | null): boolean {
  return status === "PENDING" || status === "RUNNING";
}

function stageIndex(stage: MigrationStage | null): number {
  if (!stage) return -1;
  return PIPELINE_STAGES.indexOf(stage);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

interface LogLine {
  ts: string;
  text: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MigrationDashboard({ open, onClose }: Props) {
  const [response, setResponse] = useState<MigrationStatusResponse | null>(
    null
  );
  const [launching, setLaunching] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStageRef = useRef<MigrationStage | null>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resume polling if dashboard is opened mid-migration
  useEffect(() => {
    if (!open) return;
    getMigrationStatus().then((data) => {
      if (!data) return;
      setResponse(data);
      prevStageRef.current = data.stage;
      if (isActiveStatus(data.status)) {
        startPolling();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function addLog(text: string) {
    setLogs((prev) => [...prev, { ts: now(), text }]);
  }

  function stopPolling() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  async function doPoll() {
    const data = await getMigrationStatus();
    if (!data) return;

    setResponse(data);

    const prev = prevStageRef.current;
    if (data.stage !== prev && data.stage !== "DONE") {
      addLog(`Этап: ${STAGE_LABELS[data.stage]} — начат`);
    }
    if (data.stage === "DONE" && prev !== "DONE") {
      addLog(`Синхронизация завершена за ${formatMs(data.elapsedMs)}`);
    }
    if (data.status === "FAILED" && data.error && prev !== data.stage) {
      addLog(`Ошибка: ${data.error}`);
    }
    prevStageRef.current = data.stage;

    if (data.status === "DONE" || data.status === "FAILED") {
      stopPolling();
    }
  }

  function startPolling() {
    stopPolling();
    intervalRef.current = setInterval(doPoll, 3000);
  }

  async function handleStart() {
    if (launching) return;
    setLaunching(true);
    setLogs([]);
    setResponse(null);
    prevStageRef.current = null;
    addLog("Запуск синхронизации...");

    const result = await startMigration();

    if (!result.ok) {
      addLog(`Ошибка: ${result.message ?? "Неизвестная ошибка"}`);
      setLaunching(false);
      return;
    }

    addLog("Запрос принят. Ожидаем статус...");
    startPolling();
    await doPoll();
    setLaunching(false);
  }

  const status = response?.status ?? null;
  const currentStage = response?.stage ?? null;
  const currentStageIdx = stageIndex(currentStage);
  const active = isActiveStatus(status);
  const canStart = !active && !launching;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
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
              <p className="text-xs text-gray-400">
                Миграция из сервиса Аналитики
              </p>
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
          {/* Status bar */}
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
            <StatusBadge status={status} stage={currentStage} />

            {response && response.elapsedMs > 0 && active && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={12} />
                {formatMs(response.elapsedMs)}
              </span>
            )}

            {canStart ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <PlayCircle size={15} />
                Запустить синхронизацию
              </button>
            ) : (
              <button
                disabled
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white bg-green-400 cursor-not-allowed"
              >
                <Loader2 size={15} className="animate-spin" />
                {launching ? "Запуск..." : "Выполняется..."}
              </button>
            )}
          </div>

          {/* Error alert */}
          {status === "FAILED" && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle
                size={15}
                className="mt-0.5 shrink-0 text-red-500"
              />
              <span>{response?.error ?? "Произошла ошибка синхронизации"}</span>
            </div>
          )}

          {/* Success alert */}
          {status === "DONE" && (
            <div className="flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 size={15} className="shrink-0 text-green-500" />
              <span>
                Синхронизация завершена успешно за{" "}
                <span className="font-semibold">
                  {formatMs(response?.elapsedMs ?? 0)}
                </span>
              </span>
            </div>
          )}

          {/* Stage stepper */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Этапы
            </p>
            <div className="space-y-0.5">
              {PIPELINE_STAGES.map((stage, idx) => {
                const isDone =
                  status === "DONE" ||
                  (currentStageIdx > idx && currentStageIdx !== -1);
                const isCurrent =
                  stage === currentStage && active;
                const processed =
                  response?.stats?.[stage]?.processed ?? 0;
                const failed = response?.stats?.[stage]?.failed ?? 0;

                return (
                  <div
                    key={stage}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors duration-300",
                      isCurrent
                        ? "bg-green-50"
                        : isDone
                        ? "bg-gray-50/60"
                        : "bg-transparent"
                    )}
                  >
                    {/* Stage indicator */}
                    <div className="w-5 flex justify-center shrink-0">
                      {isDone ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : isCurrent ? (
                        <span className="relative flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                        </span>
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full border-2 border-gray-200 bg-white" />
                      )}
                    </div>

                    {/* Stage name */}
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        isCurrent
                          ? "font-semibold text-green-700"
                          : isDone
                          ? "text-gray-500"
                          : "text-gray-400"
                      )}
                    >
                      {STAGE_LABELS[stage]}
                    </span>

                    {/* Per-stage stats */}
                    {(processed > 0 || failed > 0) && (
                      <div className="flex items-center gap-2 text-xs tabular-nums">
                        <span className="text-gray-500">
                          {processed.toLocaleString("ru-RU")}
                        </span>
                        {failed > 0 && (
                          <span className="text-red-400">
                            −{failed.toLocaleString("ru-RU")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          {(response?.totalProcessed ?? 0) > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-center">
                <p className="text-2xl font-bold tabular-nums text-gray-900">
                  {(response?.totalProcessed ?? 0).toLocaleString("ru-RU")}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">Обработано</p>
              </div>
              {(response?.totalFailed ?? 0) > 0 ? (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center">
                  <p className="text-2xl font-bold tabular-nums text-red-600">
                    {(response?.totalFailed ?? 0).toLocaleString("ru-RU")}
                  </p>
                  <p className="mt-0.5 text-xs text-red-400">Ошибок</p>
                </div>
              ) : (
                <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-center">
                  <p className="text-2xl font-bold tabular-nums text-green-600">
                    0
                  </p>
                  <p className="mt-0.5 text-xs text-green-400">Ошибок</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Terminal log */}
        <div className="shrink-0 border-t border-gray-100">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
            <span className="text-xs font-mono text-gray-400">
              лог синхронизации
            </span>
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
              <span className="text-gray-600">
                Логи появятся после запуска синхронизации...
              </span>
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

function StatusBadge({
  status,
  stage,
}: {
  status: MigrationTaskStatus | null;
  stage: MigrationStage | null;
}) {
  if (!status) {
    return (
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-gray-300" />
        <span className="text-sm text-gray-500">Ожидание</span>
      </div>
    );
  }

  if (status === "PENDING") {
    return (
      <div className="flex items-center gap-2">
        <Loader2 size={14} className="animate-spin text-amber-500" />
        <span className="text-sm text-amber-600">В очереди</span>
      </div>
    );
  }

  if (status === "RUNNING") {
    return (
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        <span className="text-sm font-medium text-gray-700">
          В процессе
          {stage && stage !== "DONE" && (
            <span className="ml-1.5 font-normal text-gray-400">
              — {STAGE_LABELS[stage]}
            </span>
          )}
        </span>
      </div>
    );
  }

  if (status === "DONE") {
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
