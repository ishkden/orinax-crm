"use client";

import { useEffect, useState } from "react";
import { Trash2, Check, X, Shield } from "lucide-react";

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

const ROLES = ["ADMIN", "MANAGER", "AGENT"] as const;

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

const PROTECTED_EMAIL = "admin@orinax.ai";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<{ id: string; newRole: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: "role" | "delete";
    userId: string;
    userEmail: string;
    newRole?: string;
  } | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

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

  function openRoleChange(userId: string, userEmail: string, newRole: string) {
    setConfirmModal({ type: "role", userId, userEmail, newRole });
    setConfirmInput("");
  }

  function openDelete(userId: string, userEmail: string) {
    setConfirmModal({ type: "delete", userId, userEmail });
    setConfirmInput("");
  }

  async function handleConfirm() {
    if (!confirmModal) return;
    if (confirmInput !== confirmModal.userEmail) return;

    setSaving(true);
    try {
      if (confirmModal.type === "role") {
        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: confirmModal.userId, role: confirmModal.newRole }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || "Ошибка");
        } else {
          showToast(`Роль ${confirmModal.userEmail} изменена на ${roleLabels[confirmModal.newRole!] || confirmModal.newRole}`);
        }
      } else {
        const res = await fetch("/api/admin/users", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: confirmModal.userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || "Ошибка");
        } else {
          showToast(`Пользователь ${confirmModal.userEmail} удалён`);
        }
      }
    } catch {
      showToast("Ошибка соединения");
    }
    setSaving(false);
    setConfirmModal(null);
    setEditingRole(null);
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
            {users.map((user) => {
              const isProtected = user.email === PROTECTED_EMAIL;
              const isEditing = editingRole?.id === user.id;

              return (
                <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-400 shrink-0">
                        {isProtected ? (
                          <Shield className="w-4 h-4 text-brand-400" />
                        ) : (
                          (user.name || user.email)[0].toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white truncate">
                          {user.name || "—"}
                          {isProtected && (
                            <span className="ml-2 text-[10px] text-brand-400 font-medium uppercase">
                              Super Admin
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={editingRole.newRole}
                          onChange={(e) =>
                            setEditingRole({ id: user.id, newRole: e.target.value })
                          }
                          className="bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-xs text-white focus:ring-2 focus:ring-brand-500 outline-none"
                        >
                          {ROLES.filter((r) => r !== "ADMIN").map((r) => (
                            <option key={r} value={r}>
                              {roleLabels[r]}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() =>
                            openRoleChange(user.id, user.email, editingRole.newRole)
                          }
                          className="p-1 rounded text-green-400 hover:bg-green-500/10"
                          title="Сохранить"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingRole(null)}
                          className="p-1 rounded text-gray-500 hover:bg-gray-700"
                          title="Отмена"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (isProtected) return;
                          setEditingRole({ id: user.id, newRole: user.role === "ADMIN" ? "AGENT" : user.role });
                        }}
                        disabled={isProtected}
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                          roleBadge[user.role] || roleBadge.AGENT
                        } ${isProtected ? "cursor-default" : "cursor-pointer hover:ring-1 hover:ring-gray-600"}`}
                        title={isProtected ? "Роль Super Admin нельзя изменить" : "Нажмите для изменения роли"}
                      >
                        {roleLabels[user.role] || user.role}
                      </button>
                    )}
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
                    {!isProtected && (
                      <button
                        onClick={() => openDelete(user.id, user.email)}
                        disabled={deleting === user.id}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-gray-500">
            Пользователей пока нет
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <h2 className="text-lg font-semibold text-white mb-1">
              {confirmModal.type === "role" ? "Изменить роль" : "Удалить пользователя"}
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              {confirmModal.type === "role" ? (
                <>
                  Роль <span className="text-white font-medium">{confirmModal.userEmail}</span> будет
                  изменена на{" "}
                  <span className="text-brand-400 font-medium">
                    {roleLabels[confirmModal.newRole!] || confirmModal.newRole}
                  </span>
                </>
              ) : (
                <>
                  Пользователь{" "}
                  <span className="text-white font-medium">{confirmModal.userEmail}</span> будет
                  удалён навсегда
                </>
              )}
            </p>

            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1.5">
                Для подтверждения введите email пользователя:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={confirmModal.userEmail}
                className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none font-mono"
                autoFocus
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setConfirmModal(null);
                  setEditingRole(null);
                }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirmInput !== confirmModal.userEmail || saving}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  confirmModal.type === "delete"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-brand-600 text-white hover:bg-brand-700"
                }`}
              >
                {saving
                  ? "Сохранение..."
                  : confirmModal.type === "role"
                  ? "Сохранить"
                  : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white shadow-xl animate-in fade-in slide-in-from-bottom-4">
          {toast}
        </div>
      )}
    </div>
  );
}
