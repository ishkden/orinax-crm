"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Database,
  Table2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Layers,
  AlignLeft,
  Search,
  Hash,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface TableInfo {
  name: string;
  rowCount: number;
  columnCount: number;
}

interface Column {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
}

interface TableData {
  columns: Column[];
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") {
    const str = JSON.stringify(value);
    return str.length > 120 ? str.slice(0, 120) + "…" : str;
  }
  const str = String(value);
  return str.length > 120 ? str.slice(0, 120) + "…" : str;
}

function isNullValue(value: unknown): boolean {
  return value === null || value === undefined;
}

function getDataTypeColor(type: string): string {
  if (type.includes("int") || type === "numeric" || type === "real" || type === "double precision") {
    return "text-blue-400";
  }
  if (type.includes("char") || type === "text" || type === "name") {
    return "text-emerald-400";
  }
  if (type.includes("timestamp") || type === "date" || type === "time") {
    return "text-amber-400";
  }
  if (type === "boolean") return "text-purple-400";
  if (type === "json" || type === "jsonb") return "text-orange-400";
  if (type === "ARRAY") return "text-cyan-400";
  if (type.startsWith("USER-DEFINED")) return "text-pink-400";
  return "text-gray-400";
}

function formatNumber(n: number): string {
  return n.toLocaleString("ru-RU");
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
}) {
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-800 bg-gray-900/50">
      <span className="text-xs text-gray-500">
        {formatNumber(from)}–{formatNumber(to)} из {formatNumber(total)} строк
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-gray-600 text-xs">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                "min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-medium transition-colors",
                p === page
                  ? "bg-brand-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDatabasePage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"data" | "schema">("data");
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [schemaColumns, setSchemaColumns] = useState<Column[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const LIMIT = 20;

  const loadTables = useCallback(() => {
    setTablesLoading(true);
    fetch("/api/admin/database")
      .then((r) => r.json())
      .then((data) => {
        setTables(data);
        setTablesLoading(false);
      });
  }, []);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const loadTableData = useCallback(
    async (tableName: string, p: number) => {
      setDataLoading(true);
      try {
        const r = await fetch(
          `/api/admin/database?table=${encodeURIComponent(tableName)}&page=${p}&limit=${LIMIT}`
        );
        const data = await r.json();
        setTableData(data);
      } finally {
        setDataLoading(false);
      }
    },
    []
  );

  const loadSchema = useCallback(async (tableName: string) => {
    setDataLoading(true);
    try {
      const r = await fetch(
        `/api/admin/database?table=${encodeURIComponent(tableName)}&mode=schema`
      );
      const data = await r.json();
      setSchemaColumns(data.columns || []);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selected) return;
    setPage(1);
    setTableData(null);
    setSchemaColumns([]);
    if (viewMode === "data") {
      loadTableData(selected, 1);
    } else {
      loadSchema(selected);
    }
  }, [selected, viewMode, loadTableData, loadSchema]);

  function handlePageChange(p: number) {
    setPage(p);
    if (selected) loadTableData(selected, p);
  }

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalRows = tables.reduce((s, t) => s + t.rowCount, 0);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Left: Tables List ── */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-semibold text-white">Таблицы</span>
            </div>
            <button
              onClick={loadTables}
              className="p-1 rounded text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
              title="Обновить"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск таблицы…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-200 placeholder:text-gray-600 pl-8 pr-3 py-2 outline-none focus:border-brand-600 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {tablesLoading ? (
            <div className="px-3 space-y-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-9 bg-gray-800/60 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredTables.length === 0 ? (
            <p className="px-4 py-6 text-xs text-gray-600 text-center">
              Таблицы не найдены
            </p>
          ) : (
            filteredTables.map((t) => (
              <button
                key={t.name}
                onClick={() => setSelected(t.name)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 mx-1 rounded-lg text-left transition-colors group",
                  selected === t.name
                    ? "bg-brand-600/15 text-brand-400"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Table2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs font-medium truncate">{t.name}</span>
                </div>
                <span
                  className={cn(
                    "text-xs shrink-0 ml-1 tabular-nums",
                    selected === t.name ? "text-brand-500" : "text-gray-600"
                  )}
                >
                  {formatNumber(t.rowCount)}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-gray-800 bg-gray-900/80">
          <div className="flex justify-between text-xs text-gray-600">
            <span>{tables.length} таблиц</span>
            <span>{formatNumber(totalRows)} строк</span>
          </div>
        </div>
      </aside>

      {/* ── Right: Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-gray-600" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">
              Выберите таблицу
            </h2>
            <p className="text-sm text-gray-500 max-w-xs">
              Нажмите на таблицу слева, чтобы просмотреть её данные или структуру
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {tables.slice(0, 6).map((t) => (
                <button
                  key={t.name}
                  onClick={() => setSelected(t.name)}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <Table2 className="w-5 h-5 text-brand-400 shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-base font-semibold text-white leading-none truncate">
                    {selected}
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {tables.find((t) => t.name === selected) && (
                      <>
                        {formatNumber(
                          tables.find((t) => t.name === selected)!.rowCount
                        )}{" "}
                        строк ·{" "}
                        {tables.find((t) => t.name === selected)!.columnCount}{" "}
                        колонок
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode("data")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      viewMode === "data"
                        ? "bg-gray-700 text-white"
                        : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    Данные
                  </button>
                  <button
                    onClick={() => setViewMode("schema")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      viewMode === "schema"
                        ? "bg-gray-700 text-white"
                        : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Схема
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (viewMode === "data") loadTableData(selected, page);
                    else loadSchema(selected);
                  }}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                  title="Обновить"
                >
                  <RefreshCw className={cn("w-4 h-4", dataLoading && "animate-spin")} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {dataLoading && !tableData && !schemaColumns.length ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-6 h-6 text-brand-500 animate-spin" />
                    <p className="text-sm text-gray-500">Загрузка…</p>
                  </div>
                </div>
              ) : viewMode === "schema" ? (
                <SchemaView columns={schemaColumns} loading={dataLoading} />
              ) : (
                <DataView
                  data={tableData}
                  loading={dataLoading}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Schema View ─────────────────────────────────────────────────────────────

function SchemaView({
  columns,
  loading,
}: {
  columns: Column[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="p-6 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-800/60 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-6">
                #
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Колонка
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Тип данных
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nullable
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                По умолчанию
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Макс. длина
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {columns.map((col, i) => (
              <tr
                key={col.column_name}
                className="hover:bg-gray-800/30 transition-colors"
              >
                <td className="px-4 py-3 text-xs text-gray-600 tabular-nums">
                  {i + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                    <span className="text-white font-mono text-xs">
                      {col.column_name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "font-mono text-xs",
                      getDataTypeColor(col.data_type)
                    )}
                  >
                    {col.data_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {col.is_nullable === "YES" ? (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      YES
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                      NO
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {col.column_default ? (
                    <span className="font-mono text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                      {col.column_default.length > 40
                        ? col.column_default.slice(0, 40) + "…"
                        : col.column_default}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-700">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 tabular-nums">
                  {col.character_maximum_length ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {columns.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-600">
            Нет данных о схеме
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Data View ───────────────────────────────────────────────────────────────

function DataView({
  data,
  loading,
  onPageChange,
}: {
  data: TableData | null;
  loading: boolean;
  onPageChange: (p: number) => void;
}) {
  if (loading && !data) {
    return (
      <div className="p-6 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-800/60 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { columns, rows, total, page, limit, totalPages } = data;

  return (
    <>
      <div className="flex-1 overflow-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-gray-950/50 flex items-center justify-center z-10">
            <RefreshCw className="w-5 h-5 text-brand-500 animate-spin" />
          </div>
        )}
        <div className="min-w-max">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-900 border-b border-gray-800">
                <th className="px-4 py-3 text-left text-gray-600 font-medium w-10 select-none sticky left-0 bg-gray-900 border-r border-gray-800">
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col.column_name}
                    className="px-4 py-3 text-left whitespace-nowrap select-none"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-white font-medium">
                        {col.column_name}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-normal font-mono",
                          getDataTypeColor(col.data_type)
                        )}
                      >
                        {col.data_type}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {rows.map((row, ri) => (
                <tr
                  key={ri}
                  className="hover:bg-gray-800/25 transition-colors group"
                >
                  <td className="px-4 py-2.5 text-gray-600 tabular-nums sticky left-0 bg-gray-950 group-hover:bg-gray-900 border-r border-gray-800/60">
                    {(page - 1) * limit + ri + 1}
                  </td>
                  {columns.map((col) => {
                    const val = row[col.column_name];
                    const isNull = isNullValue(val);
                    const formatted = formatCellValue(val);
                    return (
                      <td
                        key={col.column_name}
                        className="px-4 py-2.5 max-w-xs"
                        title={isNull ? "NULL" : String(val)}
                      >
                        {isNull ? (
                          <span className="text-gray-700 italic">null</span>
                        ) : typeof val === "boolean" ? (
                          <span
                            className={
                              val ? "text-emerald-400" : "text-red-400"
                            }
                          >
                            {val ? "true" : "false"}
                          </span>
                        ) : typeof val === "number" ||
                          col.data_type.includes("int") ||
                          col.data_type === "numeric" ? (
                          <span className="text-blue-300 tabular-nums font-mono">
                            {formatted}
                          </span>
                        ) : col.data_type.includes("timestamp") ||
                          col.data_type === "date" ? (
                          <span className="text-amber-300 tabular-nums font-mono whitespace-nowrap">
                            {formatted}
                          </span>
                        ) : col.data_type === "json" ||
                          col.data_type === "jsonb" ? (
                          <span className="text-orange-300 font-mono truncate block max-w-[240px]">
                            {formatted}
                          </span>
                        ) : col.data_type === "ARRAY" ? (
                          <span className="text-cyan-300 font-mono truncate block max-w-[200px]">
                            {formatted}
                          </span>
                        ) : (
                          <span className="text-gray-200 truncate block max-w-[240px]">
                            {formatted}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-12 text-center text-gray-600"
                  >
                    Таблица пустая
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}
