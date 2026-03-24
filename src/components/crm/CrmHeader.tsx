"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { getInitials } from "@/lib/utils";
import { Bell, Plus } from "lucide-react";
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
    <header className="sticky top-0 z-30 shrink-0 border-b border-gray-100 bg-white/95 px-6 py-2 backdrop-blur-sm supports-[backdrop-filter]:bg-white/90 min-h-[3.5rem] flex items-center justify-between gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h1 className="shrink-0 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
          {title}
        </h1>
        {headerAction && (
          <div className="group flex h-[calc(4rem/3)] shrink-0 items-stretch overflow-hidden rounded-lg border border-transparent text-brand-600 transition-colors duration-[600ms] ease-in-out hover:border-gray-200 hover:bg-gray-50/80">
            <button
              type="button"
              onClick={headerAction.onClick}
              className="flex w-[calc(4rem/3)] shrink-0 items-center justify-center rounded-l-lg transition-colors duration-[600ms] ease-in-out hover:bg-gray-100/80"
              aria-label={headerAction.label}
            >
              <Plus size={12} strokeWidth={2.25} />
            </button>
            <div className="flex max-w-0 items-stretch overflow-hidden transition-[max-width] duration-[600ms] ease-in-out group-hover:max-w-[min(100vw-12rem,380px)]">
              <div className="flex items-stretch border-l border-gray-200/80">
                <button
                  type="button"
                  onClick={headerAction.onClick}
                  className="inline-flex items-center whitespace-nowrap px-2 text-[11px] font-medium leading-none text-brand-700 transition-colors duration-[600ms] ease-in-out hover:bg-gray-100/80"
                >
                  {headerAction.label}
                </button>
                {headerAction.secondary && (
                  <button
                    type="button"
                    onClick={headerAction.secondary.onClick}
                    className="inline-flex items-center whitespace-nowrap border-l border-gray-200/80 px-2 text-[11px] font-medium leading-none text-brand-700 transition-colors duration-[600ms] ease-in-out hover:bg-gray-100/80"
                  >
                    {headerAction.secondary.label}
                  </button>
                )}
              </div>
            </div>
          </div>
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
