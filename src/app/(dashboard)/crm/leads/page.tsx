"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import CrmRegisterPrimaryAction from "@/components/crm/CrmRegisterPrimaryAction";

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

const leads: never[] = [];

export default function LeadsPage() {
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(leads.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  return (
    <>
      <CrmRegisterPrimaryAction label="Добавить лид" href="/crm/leads/new" />
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm text-gray-500">{leads.length} лидов</p>
          </div>

          {leads.length === 0 ? (
            <div className="px-6 py-24 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserCheck size={24} className="text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Лиды появятся здесь</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                Лиды — это первичные обращения, которые ещё не стали сделками. Обрабатывайте и конвертируйте их в контакты и сделки.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Имя", "Источник", "Статус", "Ответственный", "Добавлен"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50" />
                </table>
              </div>

              <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm text-gray-500">
                  {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, leads.length)} из {leads.length}
                </span>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-400">Показывать по</span>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <button
                        key={size}
                        onClick={() => setPageSize(size)}
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
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Предыдущая страница"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm text-gray-600 tabular-nums px-1">
                      {safePage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
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
      </div>
    </>
  );
}
