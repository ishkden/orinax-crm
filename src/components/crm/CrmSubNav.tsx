"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Briefcase, Users, Building2, UserCheck } from "lucide-react";

const tabs = [
  { href: "/crm/deals", label: "Сделки", icon: Briefcase },
  { href: "/crm/contacts", label: "Контакты", icon: Users },
  { href: "/crm/companies", label: "Компании", icon: Building2 },
  { href: "/crm/leads", label: "Лиды", icon: UserCheck },
];

export default function CrmSubNav() {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b border-gray-100 px-6 shrink-0">
      <div className="flex items-center gap-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "text-brand-600"
                  : "text-gray-500 hover:text-gray-800"
              )}
            >
              <Icon
                size={15}
                className={cn(
                  "shrink-0",
                  isActive ? "text-brand-500" : "text-gray-400"
                )}
              />
              {label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
