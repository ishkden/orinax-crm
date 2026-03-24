"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { getInitials } from "@/lib/utils";
import { Bell } from "lucide-react";
import { useCrmHeaderAction } from "./CrmHeaderActionContext";

const ROUTE_TITLES: { prefix: string; title: string }[] = [
  { prefix: "/crm/deals", title: "Сделки" },
  { prefix: "/crm/contacts", title: "Контакты" },
  { prefix: "/crm/companies", title: "Компании" },
  { prefix: "/crm/leads", title: "Лиды" },
];

export default function CrmHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { headerAction } = useCrmHeaderAction();
  const name = session?.user?.name || session?.user?.email || "User";

  const title =
    ROUTE_TITLES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"))
      ?.title ?? "CRM";

  return (
    <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between shrink-0 gap-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <h1 className="text-base font-semibold text-gray-900 tracking-tight shrink-0">
          {title}
        </h1>
        {headerAction && (
          <button
            type="button"
            onClick={headerAction.onClick}
            className="shrink-0 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors shadow-sm"
          >
            {headerAction.label}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors duration-150"
        >
          <Bell size={16} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-brand-600 font-semibold text-xs">{getInitials(name)}</span>
          </div>
          <span className="hidden sm:block text-sm font-medium text-gray-700">{name}</span>
        </div>
      </div>
    </header>
  );
}
