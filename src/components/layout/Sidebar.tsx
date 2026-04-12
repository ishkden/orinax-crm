"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  CheckSquare,
  Settings,
  Plug,
  PanelLeftClose,
  PanelLeft,
  Phone,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";

const navItems = [
  { href: "/crm/deals", basePath: "/crm", icon: Briefcase, label: "CRM" },
  { href: "/tasks", basePath: "/tasks", icon: CheckSquare, label: "Задачи" },
  { href: "/integrations", basePath: "/integrations", icon: Plug, label: "Интеграции" },
  { href: "/telephony", basePath: "/telephony", icon: Phone, label: "Телефония" },
  { href: "/settings", basePath: "/settings", icon: Settings, label: "Настройки" },
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

      </nav>

      <div className="px-2 py-2 border-t border-gray-100">
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
      </div>
    </aside>
  );
}
