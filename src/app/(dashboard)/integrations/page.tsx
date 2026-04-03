"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Badge from "@/components/ui/Badge";
import { RefreshCw, CheckCircle, AlertCircle, Loader2, RotateCcw } from "lucide-react";

interface ImportState {
  status: "IDLE" | "RUNNING" | "DONE" | "ERROR" | "NO_AUTH";
  startedAt?: string;
  finishedAt?: string;
  currentStage?: string;
  error?: string;
  log?: { time: string; text: string }[];
  counts?: Record<string, number>;
  totals?: Record<string, number>;
}

const STAGE_LABELS: Record<string, string> = {
  INIT: "Инициализация",
  PIPELINES: "Воронки",
  STAGES: "Стадии",
  COMPANIES: "Компании",
  CONTACTS: "Контакты",
  CHANNELS: "Каналы связи",
  DEALS: "Сделки",
  DEAL_CONTACTS: "Связи сделка-контакт",
  LEADS: "Лиды",
  ACTIVITIES: "Активности",
  DONE: "Готово",
};

const COUNT_LABELS: Record<string, string> = {
  pipelines: "Воронки",
  stages: "Стадии",
  companies: "Компании",
  contacts: "Контакты",
  channels: "Каналы",
  deals: "Сделки",
  dealContacts: "Связи",
  leads: "Лиды",
  activities: "Активности",
};

export default function IntegrationsPage() {
  const [state, setState] = useState<ImportState>({ status: "IDLE" });
  const [starting, setStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/import/analytics");
      if (!res.ok) return;
      const data = await res.json();
      setState(data.status ? data : { status: "IDLE" });
    } catch { /* network error */ }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (state.status === "RUNNING") {
      pollRef.current = setInterval(fetchStatus, 1500);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [state.status, fetchStatus]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.log?.length]);

  const startImport = async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/import/analytics", { method: "POST" });
      if (res.ok) {
        setState((prev) => ({ ...prev, status: "RUNNING" }));
      } else {
        const data = await res.json();
        if (data.state?.status === "RUNNING") {
          setState(data.state);
        }
      }
    } catch { /* ignore */ }
    setStarting(false);
  };

  const resetImport = async () => {
    await fetch("/api/import/analytics", { method: "DELETE" });
    setState({ status: "IDLE" });
  };

  const isRunning = state.status === "RUNNING";
  const isDone = state.status === "DONE";
  const isError = state.status === "ERROR";
  const hasData = isRunning || isDone || isError;

  const elapsed = state.startedAt
    ? Math.round(
        ((state.finishedAt ? new Date(state.finishedAt).getTime() : Date.now()) -
          new Date(state.startedAt).getTime()) / 1000,
      )
    : 0;

  const stageOrder = ["PIPELINES", "STAGES", "COMPANIES", "CONTACTS", "CHANNELS", "DEALS", "DEAL_CONTACTS", "LEADS", "ACTIVITIES", "DONE"];
  const currentIdx = stageOrder.indexOf(state.currentStage ?? "");

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Main card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="text-3xl">📊</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-semibold text-gray-900">Импорт из Orinax Analytics</h3>
                {isRunning && <Badge variant="info">Выполняется</Badge>}
                {isDone && <Badge variant="success">Завершён</Badge>}
                {isError && <Badge variant="error">Ошибка</Badge>}
                {!hasData && <Badge variant="default">Готов к запуску</Badge>}
              </div>
              <p className="text-sm text-gray-500">
                Разовый перенос всех данных из аналитики: воронки, сделки, контакты, компании, лиды, активности.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 mb-5">
            {(!hasData || isError) && (
              <button
                onClick={startImport}
                disabled={starting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {starting ? "Запуск..." : isError ? "Попробовать снова" : "Синхронизировать"}
              </button>
            )}
            {isDone && (
              <button
                onClick={resetImport}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Сбросить и запустить заново
              </button>
            )}
            {isRunning && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Импорт выполняется... {elapsed > 0 ? `${elapsed}с` : ""}</span>
              </div>
            )}
          </div>

          {/* Stage progress bar */}
          {hasData && (
            <div className="mb-5">
              <div className="flex items-center gap-1">
                {stageOrder.map((stage, i) => {
                  const done = i < currentIdx || state.status === "DONE";
                  const active = i === currentIdx && isRunning;
                  return (
                    <div key={stage} className="flex-1 flex flex-col items-center">
                      <div
                        className={`h-2 w-full rounded-full transition-colors ${
                          done ? "bg-green-500" : active ? "bg-blue-500 animate-pulse" : "bg-gray-200"
                        }`}
                      />
                      <span className={`text-[10px] mt-1 ${done ? "text-green-600" : active ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                        {STAGE_LABELS[stage]?.split(" ")[0] ?? stage}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Counts grid */}
          {state.counts && Object.keys(state.counts).length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-5">
              {Object.entries(COUNT_LABELS).map(([key, label]) => {
                const count = state.counts?.[key];
                const total = state.totals?.[key];
                if (count === undefined && total === undefined) return null;
                return (
                  <div key={key} className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {(count ?? 0).toLocaleString("ru-RU")}
                      {total ? <span className="text-xs font-normal text-gray-400">/{total.toLocaleString("ru-RU")}</span> : null}
                    </div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Live log */}
          {state.log && state.log.length > 0 && (
            <div className="bg-gray-950 rounded-lg p-4 max-h-60 overflow-y-auto font-mono text-xs">
              {state.log.map((entry, i) => {
                const time = new Date(entry.time).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                const isErr = entry.text.startsWith("ОШИБКА");
                return (
                  <div key={i} className={`${isErr ? "text-red-400" : "text-green-400"} leading-relaxed`}>
                    <span className="text-gray-500">{time}</span>{" "}
                    {entry.text}
                  </div>
                );
              })}
              <div ref={logEndRef} />
            </div>
          )}

          {/* Error display */}
          {isError && state.error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{state.error}</div>
            </div>
          )}

          {/* Done summary */}
          {isDone && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Импорт завершён за {elapsed}с. Все данные из аналитики перенесены в CRM.
              </span>
            </div>
          )}
        </div>

        {/* Other integrations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "Orinax Connectors", desc: "Подключение внешних источников данных", icon: "🔌" },
            { name: "Telegram", desc: "Уведомления о новых лидах и задачах", icon: "✈️" },
            { name: "Email (SMTP)", desc: "Отправка писем клиентам из CRM", icon: "📧" },
          ].map((i) => (
            <div key={i.name} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-3">
              <div className="text-2xl">{i.icon}</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{i.name}</h3>
                  <Badge variant="warning">Скоро</Badge>
                </div>
                <p className="text-xs text-gray-500">{i.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
