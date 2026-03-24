"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  UserCheck,
  CheckSquare,
  Settings,
  BarChart2,
  Plug,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { signOut } from "next-auth/react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

interface NavGroup {
  label: string;
  icon: LucideIcon;
  basePath: string;
  items: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

const navigation: NavEntry[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Дашборд" },
  {
    label: "CRM",
    icon: Briefcase,
    basePath: "/crm",
    items: [
      { href: "/crm/deals", icon: Briefcase, label: "Сделки" },
      { href: "/crm/contacts", icon: Users, label: "Контакты" },
      { href: "/crm/companies", icon: Building2, label: "Компании" },
      { href: "/crm/leads", icon: UserCheck, label: "Лиды" },
    ],
  },
  { href: "/tasks", icon: CheckSquare, label: "Задачи" },
  { href: "/analytics", icon: BarChart2, label: "Аналитика" },
  { href: "/integrations", icon: Plug, label: "Интеграции" },
  { href: "/settings", icon: Settings, label: "Настройки" },
];

function NavLink({ href, icon: Icon, label, pathname }: NavItem & { pathname: string }) {
  const isActive = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
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
}

function NavGroupSection({ group, pathname }: { group: NavGroup; pathname: string }) {
  const isGroupActive = pathname.startsWith(group.basePath);
  const [open, setOpen] = useState(isGroupActive);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full transition-colors duration-150",
          isGroupActive
            ? "text-brand-600 font-medium"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-normal"
        )}
      >
        <group.icon
          size={16}
          className={cn(
            "shrink-0 transition-colors",
            isGroupActive ? "text-brand-500" : "text-gray-400"
          )}
        />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown
          size={14}
          className={cn(
            "shrink-0 text-gray-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="ml-4 pl-3 border-l border-gray-100 mt-0.5 space-y-0.5">
          {group.items.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-60 bg-white border-r border-gray-100 min-h-screen shrink-0">
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-gray-100">
        <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xs tracking-tight">O</span>
        </div>
        <span className="font-semibold text-gray-900 text-sm tracking-tight">Orinax CRM</span>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navigation.map((entry) =>
          isGroup(entry) ? (
            <NavGroupSection key={entry.label} group={entry} pathname={pathname} />
          ) : (
            <NavLink key={entry.href} {...entry} pathname={pathname} />
          )
        )}
      </nav>

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
