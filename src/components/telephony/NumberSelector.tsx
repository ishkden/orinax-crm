"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Phone,
  Search,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Типы ─────────────────────────────────────────────────────────────────────

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

// ─── Утилиты ──────────────────────────────────────────────────────────────────

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

// ─── Компонент ────────────────────────────────────────────────────────────────

export default function NumberSelector() {
  const [selectedCity, setSelectedCity] = useState<City>(CITIES[0]);
  const [cityOpen, setCityOpen] = useState(false);
  const [beautiLevel, setBeautiLevel] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

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

  const searchNumbers = useCallback(async (city: City, level: number) => {
    setLoadingSearch(true);
    setSearchError("");
    setAvailable([]);
    setPurchaseSuccess(null);
    setPurchaseError(null);
    try {
      const res = await fetch(`/api/mcn/numbers?regionCode=${city.code}&beautiLevel=${level}`);
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
    searchNumbers(selectedCity, beautiLevel);
  }, [selectedCity, beautiLevel, searchNumbers]);

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
                  {pn.regionName && (
                    <span className="text-xs text-gray-400">{pn.regionName}</span>
                  )}
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
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-100">

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

          {/* Уровень */}
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
          <div className="divide-y divide-gray-50">
            {filtered.slice(0, 40).map((num) => (
              <div
                key={num.number}
                className="flex items-center justify-between px-4 py-2 hover:bg-gray-50/60 transition-colors group"
              >
                {/* Номер + бейдж */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <Phone size={13} className="text-gray-300 group-hover:text-indigo-400 transition-colors shrink-0" />
                  <span className="text-sm font-mono text-gray-900 tabular-nums">
                    {formatPhone(num.number)}
                  </span>
                  {num.beautiLevel > 0 && (
                    <BeautiDot level={num.beautiLevel} />
                  )}
                </div>

                {/* Цена + кнопка */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    {num.pricePerMonth > 0 ? (
                      <span className="text-xs text-gray-500">
                        {(num.pricePerMonth / 100).toLocaleString("ru-RU")} ₽/мес
                      </span>
                    ) : null}
                    {num.priceSetup > 0 ? (
                      <span className="text-xs text-gray-400 ml-2">
                        +{(num.priceSetup / 100).toLocaleString("ru-RU")} ₽
                      </span>
                    ) : null}
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
        )}

        {filtered.length > 40 && (
          <p className="text-xs text-gray-400 text-center py-3 border-t border-gray-50">
            Показано 40 из {filtered.length.toLocaleString("ru-RU")} — уточните фильтр
          </p>
        )}
      </div>
    </div>
  );
}
