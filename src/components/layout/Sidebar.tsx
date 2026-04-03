"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  CheckSquare,
  Plug,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Database,
  Zap,
  PhoneCall,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";
import MigrationDashboard from "./MigrationDashboard";

interface NavItem {
  href: string;
  basePath: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { href: "/crm/deals", basePath: "/crm", icon: Briefcase, label: "CRM" },
      { href: "/dashboard", basePath: "/dashboard", icon: LayoutDashboard, label: "Дашборд" },
      { href: "/tasks", basePath: "/tasks", icon: CheckSquare, label: "Задачи" },
      { href: "/integrations", basePath: "/integrations", icon: Plug, label: "Интеграции" },
    ],
  },
  {
    title: "Автоматизация с ИИ",
    items: [
      { href: "/ai-automation", basePath: "/ai-automation", icon: Zap, label: "ИИ Автоматизация" },
      { href: "/ai-calls", basePath: "/ai-calls", icon: PhoneCall, label: "ИИ Звонки" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggleSidebar } = useSidebar();
  const [migrationOpen, setMigrationOpen] = useState(false);

  return (
    <>
    <aside
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col border-r border-gray-100 bg-white transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {navSections.map((section, si) => (
          <div key={si}>
            {si > 0 && <div className="h-px bg-gray-100 my-2" />}
            {section.title && !collapsed && (
              <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ href, basePath, icon: Icon, label }) => {
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
            </div>
          </div>
        ))}
      </nav>

      <div className="px-2 py-2 border-t border-gray-100 space-y-0.5">
        <button
          type="button"
          onClick={() => setMigrationOpen(true)}
          title="Синхронизация данных"
          className={cn(
            "flex items-center w-full rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors duration-150",
            collapsed ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2"
          )}
        >
          <Database size={18} className="shrink-0" />
          {!collapsed && <span>Синхронизация</span>}
        </button>

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
          onClick={() => { window.location.href = "https://my.orinax.ai/api/auth/logout?callbackUrl=https://my.orinax.ai/login"; }}
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

    <MigrationDashboard open={migrationOpen} onClose={() => setMigrationOpen(false)} />
    </>
  );
}
