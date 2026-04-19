"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Paintbrush,
  Database,
  LogOut,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/orgs", label: "Организации", icon: Building2 },
  { href: "/admin/database", label: "База данных", icon: Database },
  { href: "/admin/styles", label: "Стили", icon: Paintbrush },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();


  function handleLogout() {
    window.location.href = "https://analytics.orinax.ai/api/auth/logout?callbackUrl=https://analytics.orinax.ai/login";
  }

  return (
    <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">
              Orinax Admin
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Панель управления</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-brand-600/15 text-brand-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Выйти
        </button>
      </div>
    </aside>
  );
}
