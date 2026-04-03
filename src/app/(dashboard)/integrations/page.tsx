"use client";

import { useState, useCallback } from "react";
import Badge from "@/components/ui/Badge";
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ImportProgress {
  stage: string;
  message: string;
  count?: number;
  total?: number;
  summary?: Record<string, number>;
}

export default function IntegrationsPage() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);

  const startImport = useCallback(async () => {
    setImporting(true);
    setProgress([]);
    setDone(false);
    setError(null);
    setSummary(null);

    try {
      const response = await fetch("/api/import/analytics", { method: "POST" });
      if (!response.ok || !response.body) {
        setError(`Ошибка: ${response.status}`);
        setImporting(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done: readerDone, value } = await reader.read();
        if (readerDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as ImportProgress;
            if (data.stage === "ERROR") {
              setError(data.message);
            } else if (data.stage === "DONE") {
              setDone(true);
            } else if (data.stage === "SUMMARY") {
              setSummary(data.summary ?? null);
              setDone(true);
            } else {
              setProgress((prev) => {
                const idx = prev.findIndex((p) => p.stage === data.stage);
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = data;
                  return next;
                }
                return [...prev, data];
              });
            }
          } catch {
            // skip malformed
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setImporting(false);
    }
  }, []);

  const stageLabels: Record<string, string> = {
    PIPELINES: "Воронки",
    STAGES: "Стадии",
    COMPANIES: "Компании",
    CONTACTS: "Контакты",
    CHANNELS: "Каналы связи",
    DEALS: "Сделки",
    DEAL_CONTACTS: "Связи сделка-контакт",
    LEADS: "Лиды",
    ACTIVITIES: "Активности",
  };

  const summaryLabels: Record<string, string> = {
    pipelines: "Воронки",
    stages: "Стадии",
    companies: "Компании",
    contacts: "Контакты",
    channels: "Каналы связи",
    deals: "Сделки",
    dealContacts: "Связи",
    leads: "Лиды",
    activities: "Активности",
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Analytics Integration — active */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="text-3xl">📊</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900">Orinax Analytics</h3>
                <Badge variant="success">Доступно</Badge>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Импорт всех данных из аналитики: воронки, сделки, контакты, компании, лиды, активности.
                Разовая синхронизация для переноса данных из Битрикса.
              </p>
              <button
                onClick={startImport}
                disabled={importing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {importing ? "Импорт..." : "Синхронизировать"}
              </button>
            </div>
          </div>

          {/* Progress */}
          {progress.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
              {progress.map((p) => (
                <div key={p.stage} className="flex items-center gap-2 text-sm">
                  {importing && progress[progress.length - 1]?.stage === p.stage ? (
                    <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin flex-shrink-0" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                  )}
                  <span className="text-gray-600">
                    {stageLabels[p.stage] ?? p.stage}:
                  </span>
                  <span className="font-medium text-gray-900">
                    {p.count !== undefined ? p.count.toLocaleString("ru-RU") : ""}
                    {p.total ? ` / ${p.total.toLocaleString("ru-RU")}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {done && summary && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">Импорт завершён</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(summary).map(([key, val]) => (
                  <div key={key} className="text-center">
                    <div className="text-lg font-bold text-green-700">{val.toLocaleString("ru-RU")}</div>
                    <div className="text-xs text-green-600">{summaryLabels[key] ?? key}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-red-800">Ошибка: </span>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Other integrations — coming soon */}
        {[
          { name: "Orinax Connectors", desc: "Подключение внешних источников данных и автоматизация потоков", icon: "🔌" },
          { name: "Telegram", desc: "Уведомления о новых лидах и задачах в Telegram", icon: "✈️" },
          { name: "Email (SMTP)", desc: "Отправка писем клиентам прямо из CRM", icon: "📧" },
        ].map((integration) => (
          <div
            key={integration.name}
            className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4"
          >
            <div className="text-3xl">{integration.icon}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                <Badge variant="warning">Скоро</Badge>
              </div>
              <p className="text-sm text-gray-500">{integration.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
