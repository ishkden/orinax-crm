"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Building2,
  UserCircle,
  Briefcase,
  ListTodo,
  MessageSquare,
  Building,
} from "lucide-react";

interface Stats {
  counts: {
    users: number;
    orgs: number;
    contacts: number;
    companies: number;
    deals: number;
    tasks: number;
    conversations: number;
  };
  recentUsers: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: string;
  }[];
}

const statCards = [
  { key: "users", label: "Пользователи", icon: Users, color: "brand" },
  { key: "orgs", label: "Организации", icon: Building2, color: "blue" },
  { key: "contacts", label: "Контакты", icon: UserCircle, color: "emerald" },
  { key: "companies", label: "Компании", icon: Building, color: "amber" },
  { key: "deals", label: "Сделки", icon: Briefcase, color: "violet" },
  { key: "tasks", label: "Задачи", icon: ListTodo, color: "rose" },
  { key: "conversations", label: "Диалоги", icon: MessageSquare, color: "cyan" },
] as const;

const colorMap: Record<string, string> = {
  brand: "bg-brand-600/15 text-brand-400",
  blue: "bg-blue-600/15 text-blue-400",
  emerald: "bg-emerald-600/15 text-emerald-400",
  amber: "bg-amber-600/15 text-amber-400",
  violet: "bg-violet-600/15 text-violet-400",
  rose: "bg-rose-600/15 text-rose-400",
  cyan: "bg-cyan-600/15 text-cyan-400",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Админ",
  MANAGER: "Менеджер",
  AGENT: "Агент",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-800 rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-800/50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Дашборд</h1>
        <p className="text-sm text-gray-500 mt-1">
          Общая статистика системы
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          const count = stats.counts[card.key];
          return (
            <div
              key={card.key}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[card.color]}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-400">{card.label}</span>
              </div>
              <p className="text-2xl font-semibold text-white tabular-nums">
                {count.toLocaleString("ru-RU")}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-medium text-white">
            Последние пользователи
          </h2>
        </div>
        <div className="divide-y divide-gray-800">
          {stats.recentUsers.map((user) => (
            <div
              key={user.id}
              className="px-5 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-400">
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-white">
                    {user.name || "—"}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                  {roleLabels[user.role] || user.role}
                </span>
                <span className="text-xs text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                </span>
              </div>
            </div>
          ))}
          {stats.recentUsers.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-500">
              Пользователей пока нет
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
