"use client";

import { useState } from "react";
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
  ExternalLink,
  Phone,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useSidebar } from "./SidebarContext";

const navItems = [
  { href: "/crm/deals", basePath: "/crm", icon: Briefcase, label: "CRM" },
  { href: "/dashboard", basePath: "/dashboard", icon: LayoutDashboard, label: "Дашборд" },
  { href: "/tasks", basePath: "/tasks", icon: CheckSquare, label: "Задачи" },
  { href: "/analytics", basePath: "/analytics", icon: BarChart2, label: "Аналитика" },
  { href: "/integrations", basePath: "/integrations", icon: Plug, label: "Интеграции" },
  { href: "/telephony", basePath: "/telephony", icon: Phone, label: "Телефония" },
  { href: "/settings", basePath: "/settings", icon: Settings, label: "Настройки" },
];

const platformLinks = [
  { href: "https://my.orinax.ai/dashboard", label: "Аналитика", icon: BarChart2 },
  { href: "https://my.orinax.ai/dashboard/services", label: "Все сервисы", icon: ExternalLink },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggleSidebar } = useSidebar();

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col border-r border-gray-100 bg-white transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-60"
      )}
    >
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

        {!collapsed && (
          <div className="pt-3 mt-3 border-t border-gray-100">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Платформа</p>
          </div>
        )}
        {collapsed && <div className="pt-2 mt-2 border-t border-gray-100" />}
        {platformLinks.map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={label}
            className={cn(
              "flex items-center rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors duration-150",
              collapsed ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2"
            )}
          >
            <Icon size={18} className="shrink-0 text-gray-400" />
            {!collapsed && label}
          </a>
        ))}
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
          onClick={async () => { await signOut({ redirect: false }); window.location.href = "https://my.orinax.ai/login"; }}
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
