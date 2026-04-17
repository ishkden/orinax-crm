"use client";

import { useState, useEffect, useCallback } from "react";
import { Phone, CheckCircle2, AlertCircle, Loader2, Unplug } from "lucide-react";
import { cn } from "@/lib/utils";

interface McnSettings {
  id: string;
  mcnAccountId: string;
  mcnToken: string; // маскированный
  isActive: boolean;
  updatedAt: string;
}

type Status = "idle" | "loading" | "success" | "error";

export default function McnSettingsCard() {
  const [settings, setSettings] = useState<McnSettings | null>(null);
  const [fetchStatus, setFetchStatus] = useState<"loading" | "ready">("loading");

  const [accountId, setAccountId] = useState("");
  const [token, setToken] = useState("");

  const [saveStatus, setSaveStatus] = useState<Status>("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [balance, setBalance] = useState<{ amount: number; currency: string } | null>(null);

  const [disconnectStatus, setDisconnectStatus] = useState<Status>("idle");

  const load = useCallback(async () => {
    setFetchStatus("loading");
    try {
      const res = await fetch("/api/mcn");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings ?? null);
        if (data.settings?.mcnAccountId) {
          setAccountId(data.settings.mcnAccountId);
        }
      }
    } catch {
      // ignore — покажем пустую форму
    } finally {
      setFetchStatus("ready");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId.trim() || !token.trim()) return;

    setSaveStatus("loading");
    setSaveMessage("");
    setBalance(null);

    try {
      const res = await fetch("/api/mcn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mcnAccountId: accountId.trim(), mcnToken: token.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSaveStatus("success");
        setSaveMessage("Подключено успешно.");
        setBalance({ amount: data.balance, currency: data.currency });
        setToken(""); // очищаем поле токена после сохранения
        await load();
      } else {
        setSaveStatus("error");
        setSaveMessage(data.error ?? "Неизвестная ошибка.");
      }
    } catch {
      setSaveStatus("error");
      setSaveMessage("Нет связи с сервером. Попробуйте ещё раз.");
    }
  }

  async function handleDisconnect() {
    if (!confirm("Отключить телефонию? Настройки будут деактивированы.")) return;

    setDisconnectStatus("loading");
    try {
      const res = await fetch("/api/mcn", { method: "DELETE" });
      if (res.ok) {
        setSettings(null);
        setAccountId("");
        setToken("");
        setSaveStatus("idle");
        setSaveMessage("");
        setBalance(null);
        setDisconnectStatus("idle");
      } else {
        const data = await res.json();
        alert(data.error ?? "Не удалось отключить телефонию.");
        setDisconnectStatus("idle");
      }
    } catch {
      alert("Нет связи с сервером.");
      setDisconnectStatus("idle");
    }
  }

  const isConnected = !!settings?.isActive;

  if (fetchStatus === "loading") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-3 text-sm text-gray-400">
        <Loader2 size={16} className="animate-spin" />
        Загрузка настроек…
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
          <Phone size={20} className="text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-base">Телефония Orinax</h3>
            {isConnected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Подключено
              </span>
            )}
            {settings && !settings.isActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                Отключено
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Телефония и запись звонков
          </p>
        </div>
      </div>

      {/* Текущие данные, если подключено */}
      {isConnected && settings && (
        <div className="mb-5 p-3.5 rounded-lg bg-gray-50 border border-gray-100 text-sm space-y-1.5">
          <div className="flex gap-3">
            <span className="text-gray-400 w-28 shrink-0">Лицевой счёт</span>
            <span className="text-gray-800 font-mono font-medium">{settings.mcnAccountId}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-gray-400 w-28 shrink-0">API-токен</span>
            <span className="text-gray-500 font-mono">{settings.mcnToken}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-gray-400 w-28 shrink-0">Обновлено</span>
            <span className="text-gray-500">
              {new Date(settings.updatedAt).toLocaleString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      )}

      {/* Форма */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Номер лицевого счёта
          </label>
          <input
            type="text"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="Например: 123456789"
            required
            className={cn(
              "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition",
              "focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
              "disabled:bg-gray-50 disabled:text-gray-500"
            )}
            disabled={saveStatus === "loading"}
          />
          <p className="text-xs text-gray-400">Идентификатор вашего аккаунта</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            {isConnected ? "Новый API-токен (оставьте пустым, чтобы не менять)" : "API-токен"}
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={isConnected ? "Введите новый токен для замены" : "API-токен"}
            required={!isConnected}
            className={cn(
              "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition",
              "focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
              "disabled:bg-gray-50 disabled:text-gray-500"
            )}
            disabled={saveStatus === "loading"}
          />
        </div>

        {/* Статус сохранения */}
        {saveStatus === "success" && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-800">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-600" />
            <div>
              <span className="font-medium">{saveMessage}</span>
              {balance !== null && (
                <span className="block text-green-700 mt-0.5">
                  Баланс: {balance.amount.toLocaleString("ru-RU")} {balance.currency}
                </span>
              )}
            </div>
          </div>
        )}

        {saveStatus === "error" && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-800">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
            <span>{saveMessage}</span>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saveStatus === "loading" || (!token.trim() && isConnected && !accountId.trim())}
            className={cn(
              "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              "bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {saveStatus === "loading" ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Проверка…
              </>
            ) : isConnected ? (
              "Обновить"
            ) : (
              "Подключить"
            )}
          </button>

          {isConnected && (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnectStatus === "loading"}
              className={cn(
                "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                "bg-white text-red-600 border border-red-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {disconnectStatus === "loading" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Unplug size={14} />
              )}
              Отключить
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
