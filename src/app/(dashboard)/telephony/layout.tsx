"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Hash, PhoneCall, Settings } from "lucide-react";

const TABS = [
  { href: "/telephony", label: "Обзор", exact: true, icon: LayoutDashboard },
  { href: "/telephony/numbers", label: "Номера", icon: Hash },
  { href: "/telephony/calls", label: "Звонки", icon: PhoneCall },
  { href: "/telephony/settings", label: "Настройки", icon: Settings },
];

export default function TelephonyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
              <PhoneCall size={18} className="text-brand-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary tracking-tight">Телефония</h1>
              <p className="text-xs text-text-tertiary">SIP / Виртуальная АТС</p>
            </div>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-gray-100/80 rounded-xl w-fit">
          {TABS.map((tab) => {
            const active = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-150",
                  active
                    ? "bg-white text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/50"
                )}
              >
                <Icon size={14} className={cn(active ? "text-brand-500" : "text-text-tertiary")} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-6">{children}</div>
    </div>
  );
}
