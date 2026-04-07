"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "info" }> = {
  LEAD:      { label: "Лид",           variant: "default" },
  PROSPECT:  { label: "Потенциальный", variant: "info"    },
  CUSTOMER:  { label: "Клиент",        variant: "success" },
  CHURNED:   { label: "Ушёл",          variant: "warning" },
};

interface ContactRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  company: string | null;
  position: string | null;
  status: string;
  createdAt: Date;
}

interface ContactsListClientProps {
  contacts: ContactRow[];
  total: number;
  page: number;
  pageSize: PageSize;
}

export default function ContactsListClient({ contacts, total, page, pageSize }: ContactsListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function navigate(newPage: number, newPageSize: PageSize) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    params.set("pageSize", String(newPageSize));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <p className="text-sm text-gray-500">{total} контактов</p>
      </div>

      {total === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-gray-400 text-sm">Нет контактов. Добавьте первый!</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Имя", "Компания", "Email", "Статус", "Добавлен"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contacts.map((c) => {
                  const status = statusConfig[c.status] ?? { label: c.status, variant: "default" as const };
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-indigo-600 font-semibold text-xs">
                              {c.firstName[0]}{c.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{c.firstName} {c.lastName}</p>
                            {c.position && <p className="text-xs text-gray-500">{c.position}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{c.company || "—"}</td>
                      <td className="px-6 py-4 text-gray-600">{c.email || "—"}</td>
                      <td className="px-6 py-4">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{formatDate(c.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
            <span className="text-sm text-gray-500">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} из {total}
            </span>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-400">Показывать по</span>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    onClick={() => navigate(1, size)}
                    className={cn(
                      "px-2.5 py-1 text-sm rounded-md transition-colors",
                      pageSize === size
                        ? "bg-gray-900 text-white font-medium"
                        : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigate(page - 1, pageSize)}
                  disabled={page === 1}
                  className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Предыдущая страница"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-gray-600 tabular-nums px-1">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => navigate(page + 1, pageSize)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Следующая страница"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
