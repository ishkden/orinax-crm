"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Phone,
  Hash,
  Wallet,
  PhoneCall,
  Zap,
  Plus,
  Settings,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface McnSettings {
  id: string;
  mcnAccountId: string;
  mcnToken: string;
  isActive: boolean;
}

interface PurchasedNumber {
  id: string;
  number: string;
  regionName: string | null;
  isActive: boolean;
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11 && d[0] === "7") {
    return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
  }
  return raw;
}

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: "brand" | "emerald" | "amber" | "blue";
}) {
  const styles = {
    brand: { bg: "bg-brand-50", text: "text-brand-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
  };
  const s = styles[color];
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-text-primary">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-text-secondary">{sub}</p>}
        </div>
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", s.bg)}>
          <Icon size={18} className={s.text} />
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-2.5 w-14 bg-gray-100 rounded" />
          <div className="h-6 w-20 bg-gray-100 rounded" />
        </div>
        <div className="w-9 h-9 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

export default function TelephonyOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [mcn, setMcn] = useState<McnSettings | null>(null);
  const [numbers, setNumbers] = useState<PurchasedNumber[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mcnRes, numRes] = await Promise.all([
        fetch("/api/mcn"),
        fetch("/api/mcn/numbers?purchased=true"),
      ]);
      if (mcnRes.ok) {
        const d = await mcnRes.json();
        setMcn(d.settings ?? null);
      }
      if (numRes.ok) {
        const d = await numRes.json();
        setNumbers(d.numbers ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const isConnected = !!mcn?.isActive;

  return (
    <div className="space-y-6 max-w-5xl">
      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger flex items-center gap-2">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Connection status */}
      {!loading && !isConnected && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">MCN Telecom не подключён</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Перейдите в <Link href="/telephony/settings" className="underline font-medium">Настройки</Link> чтобы подключить телефонию.
            </p>
          </div>
        </div>
      )}

      {!loading && isConnected && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">MCN Telecom подключён</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Лицевой счёт: <span className="font-mono font-medium">{mcn?.mcnAccountId}</span>
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <><Skeleton /><Skeleton /><Skeleton /><Skeleton /></>
        ) : (
          <>
            <StatCard
              label="Статус"
              value={isConnected ? "Активен" : "Не подключён"}
              sub={isConnected ? "MCN Telecom" : "Требуется настройка"}
              icon={Phone}
              color={isConnected ? "emerald" : "amber"}
            />
            <StatCard
              label="Номера"
              value={String(numbers.length)}
              sub={numbers.length === 0 ? "Подключите номер" : "Активных"}
              icon={Hash}
              color="brand"
            />
            <StatCard
              label="Баланс MCN"
              value="—"
              sub="В личном кабинете MCN"
              icon={Wallet}
              color="blue"
            />
            <StatCard
              label="Звонки"
              value="—"
              sub="За сегодня"
              icon={PhoneCall}
              color="amber"
            />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/telephony/settings"
          className="group rounded-xl border border-border bg-surface-raised p-4 hover:border-brand-200 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 group-hover:bg-brand-100 flex items-center justify-center transition-colors">
              <Zap size={18} className="text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {isConnected ? "Управление MCN" : "Подключить телефонию"}
              </p>
              <p className="text-xs text-text-tertiary">Настройки MCN Telecom</p>
            </div>
          </div>
        </Link>
        <Link
          href="/telephony/numbers"
          className="group rounded-xl border border-border bg-surface-raised p-4 hover:border-emerald-200 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
              <Plus size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Выбрать номер</p>
              <p className="text-xs text-text-tertiary">Городские и виртуальные DID</p>
            </div>
          </div>
        </Link>
        <Link
          href="/telephony/calls"
          className="group rounded-xl border border-border bg-surface-raised p-4 hover:border-blue-200 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
              <PhoneCall size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">История звонков</p>
              <p className="text-xs text-text-tertiary">Журнал вызовов</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Numbers list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-surface-raised shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Подключённые номера</h2>
            <Link href="/telephony/numbers" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              Все номера →
            </Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-2 animate-pulse">
              <div className="h-10 bg-gray-50 rounded-lg" />
              <div className="h-10 bg-gray-50 rounded-lg" />
            </div>
          ) : numbers.length === 0 ? (
            <div className="p-8 text-center">
              <Hash size={24} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-text-secondary">Номеров нет</p>
              <Link href="/telephony/numbers" className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-brand-600 hover:text-brand-700">
                <Plus size={12} />
                Подключить номер
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {numbers.slice(0, 5).map((n) => (
                <div key={n.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Phone size={13} className="text-emerald-500 shrink-0" />
                    <div>
                      <p className="font-mono text-sm font-medium text-text-primary">{formatPhone(n.number)}</p>
                      {n.regionName && <p className="text-[11px] text-text-tertiary">{n.regionName}</p>}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                    активен
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="rounded-xl border border-border bg-surface-raised shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border-subtle">
            <h2 className="text-sm font-semibold text-text-primary">Как подключиться</h2>
          </div>
          <div className="p-5 space-y-3">
            {[
              { n: "1", title: "Подключите MCN Telecom", desc: "Введите данные аккаунта или создайте новый" },
              { n: "2", title: "Выберите номер", desc: "Городской или виртуальный DID из каталога" },
              { n: "3", title: "Настройте интеграцию", desc: "Звонки автоматически привяжутся к сделкам и контактам" },
              { n: "4", title: "Звоните!", desc: "Используйте SIP-клиент или встроенный WebRTC-виджет" },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  i < 3 ? "bg-brand-50" : "bg-emerald-50"
                )}>
                  {i < 3 ? (
                    <span className="text-xs font-bold text-brand-700">{step.n}</span>
                  ) : (
                    <CheckCircle2 size={12} className="text-emerald-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{step.title}</p>
                  <p className="text-xs text-text-tertiary">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
