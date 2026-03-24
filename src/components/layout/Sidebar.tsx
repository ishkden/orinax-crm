"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  CheckSquare,
  Settings,
  BarChart2,
  Plug,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useSidebar } from "./SidebarContext";

const navItems = [
  { href: "/crm/deals", basePath: "/crm", icon: Briefcase, label: "CRM" },
  { href: "/dashboard", basePath: "/dashboard", icon: LayoutDashboard, label: "Дашборд" },
  { href: "/tasks", basePath: "/tasks", icon: CheckSquare, label: "Задачи" },
  { href: "/analytics", basePath: "/analytics", icon: BarChart2, label: "Аналитика" },
  { href: "/integrations", basePath: "/integrations", icon: Plug, label: "Интеграции" },
  { href: "/settings", basePath: "/settings", icon: Settings, label: "Настройки" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggleSidebar } = useSidebar();

  return (
    <aside
      className={cn(
        "flex flex-col bg-white border-r border-gray-100 min-h-screen shrink-0 transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div
        className={cn(
          "flex items-center h-14 border-b border-gray-100 shrink-0",
          collapsed ? "justify-center px-2" : "gap-2.5 px-5"
        )}
      >
        <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xs tracking-tight">O</span>
        </div>
        {!collapsed && (
          <span className="font-semibold text-gray-900 text-sm tracking-tight truncate">
            Orinax CRM
          </span>
        )}
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, basePath, icon: Icon, label }) => {
          const isActive = pathname.startsWith(basePath);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "flex items-center rounded-lg text-sm transition-colors duration-150",
                collapsed ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2",
                isActive
                  ? "bg-brand-50 text-brand-600 font-medium"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-normal"
              )}
            >
              <Icon
                size={18}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-brand-500" : "text-gray-400"
                )}
              />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-2 border-t border-gray-100 space-y-0.5">
        <button
          type="button"
          onClick={toggleSidebar}
          title={collapsed ? "Развернуть меню" : "Свернуть меню"}
          className={cn(
            "flex items-center w-full rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors duration-150",
            collapsed ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2"
          )}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          {!collapsed && <span>Свернуть</span>}
        </button>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Выйти"
          className={cn(
            "flex items-center w-full rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors duration-150",
            collapsed ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2"
          )}
        >
          <LogOut size={18} className="shrink-0 text-gray-400" />
          {!collapsed && "Выйти"}
        </button>
      </div>
    </aside>
  );
}
