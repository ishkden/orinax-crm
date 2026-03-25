"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Globe, Mail, Phone } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

interface CompanyRow {
  id: string;
  name: string;
  industry: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  createdAt: Date;
}

interface CompaniesListClientProps {
  companies: CompanyRow[];
}

export default function CompaniesListClient({ companies }: CompaniesListClientProps) {
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  const totalPages = Math.max(1, Math.ceil(companies.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = companies.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <p className="text-sm text-gray-500">{companies.length} компаний</p>
      </div>

      {companies.length === 0 ? (
        <div className="px-6 py-24 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Globe size={24} className="text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">Компании появятся здесь</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Добавляйте компании для удобной группировки контактов и сделок по организациям.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Название", "Отрасль", "Email", "Телефон", "Сайт", "Добавлена"].map((h) => (
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
                {paginated.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                          <span className="text-blue-600 font-semibold text-xs">
                            {c.name[0].toUpperCase()}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">{c.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{c.industry || "—"}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {c.email ? (
                        <span className="flex items-center gap-1.5">
                          <Mail size={12} className="text-gray-400" />
                          {c.email}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {c.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone size={12} className="text-gray-400" />
                          {c.phone}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {c.website ? (
                        <a
                          href={c.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-blue-600 hover:underline"
                        >
                          <Globe size={12} />
                          {c.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-400">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
            <span className="text-sm text-gray-500">
              {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, companies.length)} из {companies.length}
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
  );
}
