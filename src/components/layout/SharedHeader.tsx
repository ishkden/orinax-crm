"use client";

import { LogOut } from "lucide-react";

interface SharedHeaderProps {
  orgName: string;
  userName: string;
  activeService?: "analytics" | "crm" | "connector";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] || "U").toUpperCase();
}

const SERVICES = [
  {
    key: "analytics" as const,
    label: "Аналитика",
    href: "https://analytics.orinax.ai/dashboard",
  },
  {
    key: "crm" as const,
    label: "CRM",
    href: "https://crm.orinax.ai/crm/deals",
  },
  {
    key: "connector" as const,
    label: "Мессенджеры",
    href: "https://connector.orinax.ai/",
  },
];

export default function SharedHeader({
  orgName,
  userName,
  activeService = "crm",
}: SharedHeaderProps) {
  const orgInitial = (orgName?.[0] || "O").toUpperCase();
  const userInitials = getInitials(userName || "U");

  const handleLogout = () => {
    window.location.href =
      "https://my.orinax.ai/api/auth/logout?callbackUrl=https://my.orinax.ai/login";
  };

  return (
    <header className="bg-white border-b border-gray-100 h-14 flex items-center px-5 gap-4 shrink-0 z-10">
      {/* Org brand */}
      <div className="flex items-center gap-2.5 shrink-0 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-brand-500 overflow-hidden flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold leading-none">{orgInitial}</span>
        </div>
        <span className="text-sm font-semibold text-gray-900 truncate max-w-36 hidden sm:block">
          {orgName}
        </span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-gray-200 shrink-0 hidden sm:block" />

      {/* Service switcher */}
      <nav className="flex items-center gap-0.5">
        {SERVICES.map((s) => {
          const isActive = s.key === activeService;
          return (
            <a
              key={s.key}
              href={s.href}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {s.label}
            </a>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User info + logout */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
          <span className="text-brand-600 text-xs font-semibold leading-none">{userInitials}</span>
        </div>
        <span className="hidden md:block text-sm font-medium text-gray-700 truncate max-w-36">
          {userName}
        </span>
        <button
          onClick={handleLogout}
          title="Выйти"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
