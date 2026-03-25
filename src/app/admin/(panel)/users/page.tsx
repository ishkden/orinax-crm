"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  orgs: {
    role: string;
    org: { id: string; name: string; slug: string };
  }[];
}

const roleLabels: Record<string, string> = {
  ADMIN: "Админ",
  MANAGER: "Менеджер",
  AGENT: "Агент",
};

const roleBadge: Record<string, string> = {
  ADMIN: "bg-brand-600/15 text-brand-400",
  MANAGER: "bg-amber-600/15 text-amber-400",
  AGENT: "bg-gray-700 text-gray-300",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  function loadUsers() {
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Удалить пользователя ${email}?`)) return;
    setDeleting(id);
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeleting(null);
    loadUsers();
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-56" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-800/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Пользователи</h1>
        <p className="text-sm text-gray-500 mt-1">
          {users.length} пользовател{users.length === 1 ? "ь" : "ей"} в системе
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Пользователь
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Роль
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Организации
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата регистрации
              </th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-400 shrink-0">
                      {(user.name || user.email)[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white truncate">
                        {user.name || "—"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      roleBadge[user.role] || roleBadge.AGENT
                    }`}
                  >
                    {roleLabels[user.role] || user.role}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {user.orgs.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {user.orgs.map((om) => (
                        <span
                          key={om.org.id}
                          className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded"
                        >
                          {om.org.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => handleDelete(user.id, user.email)}
                    disabled={deleting === user.id}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-gray-500">
            Пользователей пока нет
          </div>
        )}
      </div>
    </div>
  );
}
