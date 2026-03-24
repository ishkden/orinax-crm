"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  Settings,
  BarChart2,
  Plug,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Дашборд" },
  { href: "/contacts", icon: Users, label: "Контакты" },
  { href: "/deals", icon: Briefcase, label: "Сделки" },
  { href: "/tasks", icon: CheckSquare, label: "Задачи" },
  { href: "/analytics", icon: BarChart2, label: "Аналитика" },
  { href: "/integrations", icon: Plug, label: "Интеграции" },
  { href: "/settings", icon: Settings, label: "Настройки" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-60 bg-white border-r border-gray-100 min-h-screen shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-gray-100">
        <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xs tracking-tight">O</span>
        </div>
        <span className="font-semibold text-gray-900 text-sm tracking-tight">Orinax CRM</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150",
                isActive
                  ? "bg-brand-50 text-brand-600 font-medium"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-normal"
              )}
            >
              <Icon
                size={16}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-brand-500" : "text-gray-400"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors duration-150 w-full"
        >
          <LogOut size={16} className="shrink-0 text-gray-400" />
          Выйти
        </button>
      </div>
    </aside>
  );
}
