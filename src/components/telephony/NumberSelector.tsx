"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Phone,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Star,
  Building2,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AvailableNumber {
  number: string;
  beautiLevel: number;
  beautiLabel: string;
  priceSetup: number;
  pricePerMonth: number;
  tariffPeriodId: number;
}

interface PurchasedNumber {
  id: string;
  number: string;
  regionName: string | null;
  beautiLevel: number;
  priceMonthly: number | null;
  purchasedAt: string;
  isActive: boolean;
}

interface City {
  code: string;
  name: string;
  mcnCityId: string;
}

const CITIES: City[] = [
  { code: "495", name: "Москва",           mcnCityId: "7495" },
  { code: "812", name: "Санкт-Петербург",  mcnCityId: "7812" },
  { code: "343", name: "Екатеринбург",     mcnCityId: "7343" },
  { code: "383", name: "Новосибирск",      mcnCityId: "7383" },
  { code: "843", name: "Казань",           mcnCityId: "7843" },
  { code: "831", name: "Нижний Новгород",  mcnCityId: "7831" },
  { code: "846", name: "Самара",           mcnCityId: "7846" },
  { code: "863", name: "Ростов-на-Дону",  mcnCityId: "7863" },
  { code: "861", name: "Краснодар",        mcnCityId: "7861" },
  { code: "347", name: "Уфа",             mcnCityId: "7347" },
];

const BEAUTI_LEVELS = [
  { value: 0, label: "Все" },
  { value: 1, label: "Бронза" },
  { value: 2, label: "Серебро" },
  { value: 3, label: "Золото" },
];

const BEAUTI_COLORS: Record<number, string> = {
  1: "text-amber-500",
  2: "text-slate-400",
  3: "text-yellow-500",
  4: "text-purple-500",
};

const NDC_TYPES = [
  { value: 1, label: "Городские", icon: Building2, hint: "495, 499, 812…" },
  { value: 2, label: "Виртуальные", icon: Smartphone, hint: "931, 958…" },
] as const;

const PAGE_SIZE = 10;

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11 && d[0] === "7") {
    return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
  }
  if (d.length === 10) {
    return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
  }
  return raw;
}

function formatPrice(kopecks: number): string {
  if (kopecks <= 0) return "";
  const rub = kopecks / 100;
  return rub % 1 === 0
    ? rub.toLocaleString("ru-RU") + " ₽"
    : rub.toLocaleString("ru-RU", { minimumFractionDigits: 2 }) + " ₽";
}

function BeautiDot({ level }: { level: number }) {
  if (level === 0) return null;
  return (
    <span className={cn("flex items-center gap-0.5 shrink-0", BEAUTI_COLORS[level] ?? "text-gray-400")}>
      {Array.from({ length: Math.min(level, 3) }).map((_, i) => (
        <Star key={i} size={9} fill="currentColor" />
      ))}
    </span>
  );
}

function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  // Показываем не более 7 кнопок: 1 ... 4 5 6 ... N
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
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-50">
      <span className="text-xs text-gray-400">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} из {total.toLocaleString("ru-RU")}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium transition",
                p === page
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default function NumberSelector() {
  const [selectedCity, setSelectedCity] = useState<City>(CITIES[0]);
  const [cityOpen, setCityOpen] = useState(false);
  const [beautiLevel, setBeautiLevel] = useState(0);
  const [ndcType, setNdcType] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const [available, setAvailable] = useState<AvailableNumber[]>([]);
  const [purchased, setPurchased] = useState<PurchasedNumber[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const loadPurchased = useCallback(async () => {
    try {
      const res = await fetch("/api/mcn/numbers?purchased=true");
      if (res.ok) {
        const data = await res.json();
        setPurchased(data.numbers ?? []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadPurchased(); }, [loadPurchased]);

  const searchNumbers = useCallback(async (city: City, level: number, type: 1 | 2) => {
    setLoadingSearch(true);
    setSearchError("");
    setAvailable([]);
    setPage(1);
    setPurchaseSuccess(null);
    setPurchaseError(null);
    try {
      const res = await fetch(`/api/mcn/numbers?regionCode=${city.code}&beautiLevel=${level}&ndcType=${type}`);
      const data = await res.json();
      if (!res.ok) { setSearchError(data.error ?? "Не удалось загрузить номера."); return; }
      setAvailable(data.numbers ?? []);
    } catch {
      setSearchError("Нет связи с сервером.");
    } finally {
      setLoadingSearch(false);
    }
  }, []);

  useEffect(() => {
    searchNumbers(selectedCity, beautiLevel, ndcType);
  }, [selectedCity, beautiLevel, ndcType, searchNumbers]);

  // Сброс страницы при изменении поискового запроса
  useEffect(() => { setPage(1); }, [searchQuery]);

  async function handlePurchase(num: AvailableNumber) {
    setPurchasing(num.number);
    setPurchaseSuccess(null);
    setPurchaseError(null);
    try {
      const res = await fetch("/api/mcn/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: num.number,
          tariffPeriodId: num.tariffPeriodId,
          beautiLevel: num.beautiLevel,
          regionCode: selectedCity.code,
          regionName: selectedCity.name,
          priceSetup: num.priceSetup,
          priceMonthly: num.pricePerMonth,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPurchaseSuccess(num.number);
        setAvailable((prev) => prev.filter((n) => n.number !== num.number));
        await loadPurchased();
      } else {
        setPurchaseError(data.error ?? "Не удалось подключить номер.");
      }
    } catch {
      setPurchaseError("Нет связи с сервером.");
    } finally {
      setPurchasing(null);
    }
  }

  const filtered = available.filter((n) =>
    !searchQuery || n.number.includes(searchQuery.replace(/\D/g, ""))
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">

      {/* Подключённые номера */}
      {purchased.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Подключённые номера</p>
          </div>
          <div className="divide-y divide-gray-50">
            {purchased.map((pn) => (
              <div key={pn.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <Phone size={13} className="text-green-500 shrink-0" />
                  <span className="text-sm font-mono text-gray-900">{formatPhone(pn.number)}</span>
                  {pn.regionName && <span className="text-xs text-gray-400">{pn.regionName}</span>}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">активен</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Поиск и выбор */}
      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">

        {/* Фильтры */}
        <div className="px-4 py-3 border-b border-gray-100 space-y-2.5">

          {/* Тип номера */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 shrink-0 w-20">Тип номера</span>
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              {NDC_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setNdcType(t.value)}
                    className={cn(
                      "flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition-all",
                      ndcType === t.value
                        ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                        : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    <Icon size={11} />
                    {t.label}
                    <span className={cn("text-[10px]", ndcType === t.value ? "text-gray-400" : "text-gray-300")}>
                      {t.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Город + красивость + поиск */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Город */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCityOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-gray-300 transition-colors"
              >
                {selectedCity.name}
                <ChevronDown size={12} className={cn("text-gray-400 transition-transform", cityOpen && "rotate-180")} />
              </button>
              {cityOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-20 py-1">
                  {CITIES.map((city) => (
                    <button
                      key={city.code}
                      type="button"
                      onClick={() => { setSelectedCity(city); setCityOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-sm transition-colors",
                        selectedCity.code === city.code
                          ? "bg-indigo-50 text-indigo-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Красивость */}
            <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5 h-8">
              {BEAUTI_LEVELS.map((bl) => (
                <button
                  key={bl.value}
                  type="button"
                  onClick={() => setBeautiLevel(bl.value)}
                  className={cn(
                    "h-6 px-2.5 rounded-md text-xs font-medium transition-all",
                    beautiLevel === bl.value
                      ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                      : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {bl.label}
                </button>
              ))}
            </div>

            {/* Поиск */}
            <div className="relative flex-1 min-w-[120px]">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по цифрам…"
                className="w-full h-8 pl-7 pr-3 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Сообщения */}
        {purchaseSuccess && (
          <div className="mx-4 mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-100 text-sm text-green-800">
            <CheckCircle2 size={14} className="text-green-600 shrink-0" />
            <span>Номер <b className="font-mono">{formatPhone(purchaseSuccess)}</b> подключён!</span>
          </div>
        )}
        {purchaseError && (
          <div className="mx-4 mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <span>{purchaseError}</span>
          </div>
        )}
        {searchError && (
          <div className="mx-4 mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-sm text-amber-700">
            <AlertCircle size={14} className="text-amber-500 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {/* Список номеров */}
        {loadingSearch ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
            <Loader2 size={15} className="animate-spin" />
            Загрузка…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-sm text-gray-400 gap-1">
            <Phone size={20} className="text-gray-200 mb-1" />
            {available.length === 0 ? "Нет доступных номеров" : "Нет номеров по фильтру"}
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {paginated.map((num) => (
                <div
                  key={num.number}
                  className="flex items-center justify-between px-4 py-2 hover:bg-gray-50/60 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Phone size={13} className="text-gray-300 group-hover:text-indigo-400 transition-colors shrink-0" />
                    <span className="text-sm font-mono text-gray-900 tabular-nums">
                      {formatPhone(num.number)}
                    </span>
                    {num.beautiLevel > 0 && <BeautiDot level={num.beautiLevel} />}
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block text-xs text-gray-400 leading-tight">
                      {formatPrice(num.pricePerMonth) && (
                        <div>{formatPrice(num.pricePerMonth)}/мес</div>
                      )}
                      {formatPrice(num.priceSetup) && (
                        <div>+{formatPrice(num.priceSetup)} подкл.</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePurchase(num)}
                      disabled={!!purchasing}
                      className={cn(
                        "h-7 px-3 rounded-lg text-xs font-medium transition-all",
                        "bg-indigo-600 text-white hover:bg-indigo-700",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                        "focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      )}
                    >
                      {purchasing === num.number
                        ? <Loader2 size={11} className="animate-spin" />
                        : "Выбрать"
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              page={page}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
