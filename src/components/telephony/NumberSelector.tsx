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
  Hash,
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

const BEAUTI_LEVELS = [
  { value: 0, label: "Стандартный" },
  { value: 1, label: "Бронзовый" },
  { value: 2, label: "Серебряный" },
  { value: 3, label: "Золотой" },
];

const BEAUTI_COLORS: Record<number, string> = {
  0: "text-gray-500",
  1: "text-amber-600",
  2: "text-slate-500",
  3: "text-yellow-500",
  4: "text-purple-500",
  5: "text-indigo-600",
};

// ─── Вспомогательные компоненты ───────────────────────────────────────────────

function BeautiStars({ level }: { level: number }) {
  if (level === 0) return null;
  return (
    <span className={cn("flex items-center gap-0.5", BEAUTI_COLORS[level])}>
      {Array.from({ length: Math.min(level, 3) }).map((_, i) => (
        <Star key={i} size={10} fill="currentColor" />
      ))}
    </span>
  );
}

function PriceTag({ setup, monthly }: { setup: number; monthly: number }) {
  return (
    <div className="text-right">
      <p className="text-sm font-semibold text-gray-900">
        {monthly.toLocaleString("ru-RU")} ₽/мес
      </p>
      {setup > 0 && (
        <p className="text-xs text-gray-400">+{setup.toLocaleString("ru-RU")} ₽ подкл.</p>
      )}
    </div>
  );
}

// ─── Основной компонент ───────────────────────────────────────────────────────

export default function NumberSelector() {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityOpen, setCityOpen] = useState(false);
  const [beautiLevel, setBeautiLevel] = useState(0);

  const [available, setAvailable] = useState<AvailableNumber[]>([]);
  const [purchased, setPurchased] = useState<PurchasedNumber[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [purchasing, setPurchasing] = useState<string | null>(null); // number being purchased
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Загрузить купленные номера
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

  // Поиск свободных номеров
  const searchNumbers = useCallback(async (city: City, level: number) => {
    setLoadingSearch(true);
    setSearchError("");
    setAvailable([]);
    setPurchaseSuccess(null);
    setPurchaseError(null);

    try {
      const res = await fetch(
        `/api/mcn/numbers?regionCode=${city.code}&beautiLevel=${level}`
      );
      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error ?? "Не удалось загрузить номера.");
        return;
      }

      // Получаем список городов из первого ответа
      if (data.cities && cities.length === 0) setCities(data.cities);
      setAvailable(data.numbers ?? []);
    } catch {
      setSearchError("Нет связи с сервером.");
    } finally {
      setLoadingSearch(false);
    }
  }, [cities.length]);

  // Первая загрузка при выборе города
  useEffect(() => {
    if (!selectedCity) return;
    searchNumbers(selectedCity, beautiLevel);
  }, [selectedCity, beautiLevel, searchNumbers]);

  // Инициализируем Москву по умолчанию
  useEffect(() => {
    const defaultCity: City = { code: "495", name: "Москва", mcnCityId: "7495" };
    setSelectedCity(defaultCity);
    setCities([
      { code: "495", name: "Москва",          mcnCityId: "7495" },
      { code: "812", name: "Санкт-Петербург", mcnCityId: "7812" },
      { code: "343", name: "Екатеринбург",    mcnCityId: "7343" },
      { code: "383", name: "Новосибирск",     mcnCityId: "7383" },
      { code: "843", name: "Казань",          mcnCityId: "7843" },
      { code: "831", name: "Нижний Новгород", mcnCityId: "7831" },
      { code: "846", name: "Самара",          mcnCityId: "7846" },
      { code: "863", name: "Ростов-на-Дону",  mcnCityId: "7863" },
      { code: "861", name: "Краснодар",       mcnCityId: "7861" },
      { code: "347", name: "Уфа",            mcnCityId: "7347" },
    ]);
  }, []);

  async function handlePurchase(num: AvailableNumber) {
    if (!selectedCity) return;
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

  // Фильтр по поисковому запросу
  const filtered = available.filter((n) =>
    !searchQuery || n.number.includes(searchQuery.replace(/\D/g, ""))
  );

  return (
    <div className="space-y-4">
      {/* ── Купленные номера ── */}
      {purchased.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Hash size={14} className="text-indigo-500" />
            Подключённые номера
          </h3>
          <div className="space-y-2">
            {purchased.map((pn) => (
              <div
                key={pn.id}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center">
                    <Phone size={13} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-mono font-medium text-gray-900">{pn.number}</p>
                    <p className="text-xs text-gray-400">
                      {pn.regionName ?? "—"}
                      {pn.priceMonthly ? ` · ${Number(pn.priceMonthly).toLocaleString("ru-RU")} ₽/мес` : ""}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 font-medium">
                  Активен
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Поиск номеров ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search size={14} className="text-indigo-500" />
          Подобрать номер
        </h3>

        <div className="flex flex-wrap gap-3 mb-4">
          {/* Выбор города */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCityOpen((v) => !v)}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 hover:border-gray-300 transition-colors min-w-[160px] justify-between"
            >
              <span>{selectedCity?.name ?? "Город"}</span>
              <ChevronDown
                size={14}
                className={cn("text-gray-400 transition-transform", cityOpen && "rotate-180")}
              />
            </button>

            {cityOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-20 py-1 overflow-hidden">
                {cities.map((city) => (
                  <button
                    key={city.code}
                    type="button"
                    onClick={() => { setSelectedCity(city); setCityOpen(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm transition-colors",
                      selectedCity?.code === city.code
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

          {/* Категория красивости */}
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-0.5 h-9">
            {BEAUTI_LEVELS.map((bl) => (
              <button
                key={bl.value}
                type="button"
                onClick={() => setBeautiLevel(bl.value)}
                className={cn(
                  "h-7 px-3 rounded-md text-xs font-medium transition-all",
                  beautiLevel === bl.value
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {bl.label}
              </button>
            ))}
          </div>

          {/* Поиск по маске */}
          <div className="relative flex-1 min-w-[140px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по цифрам…"
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Статусы */}
        {purchaseSuccess && (
          <div className="mb-3 flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-800">
            <CheckCircle2 size={15} className="text-green-600 shrink-0" />
            <span>Номер <b className="font-mono">{purchaseSuccess}</b> успешно подключён!</span>
          </div>
        )}
        {purchaseError && (
          <div className="mb-3 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
            <AlertCircle size={15} className="text-red-500 shrink-0" />
            <span>{purchaseError}</span>
          </div>
        )}
        {searchError && (
          <div className="mb-3 flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100 text-sm text-amber-700">
            <AlertCircle size={15} className="text-amber-500 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {/* Список номеров */}
        {loadingSearch ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
            <Loader2 size={16} className="animate-spin" />
            Загрузка номеров…
          </div>
        ) : filtered.length === 0 && !searchError ? (
          <div className="flex flex-col items-center justify-center py-12 text-sm text-gray-400 gap-1">
            <Phone size={24} className="text-gray-200 mb-1" />
            {available.length === 0
              ? "Выберите город для поиска номеров"
              : "Нет номеров по заданному фильтру"}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filtered.slice(0, 30).map((num) => (
              <div
                key={num.number}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors shrink-0">
                    <Phone size={14} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-mono font-medium text-gray-900 truncate">
                      {num.number}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <BeautiStars level={num.beautiLevel} />
                      {num.beautiLevel > 0 && (
                        <span className={cn("text-xs", BEAUTI_COLORS[num.beautiLevel])}>
                          {num.beautiLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <PriceTag setup={num.priceSetup} monthly={num.pricePerMonth} />
                  <button
                    type="button"
                    onClick={() => handlePurchase(num)}
                    disabled={!!purchasing}
                    className={cn(
                      "inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500",
                      "bg-indigo-600 text-white hover:bg-indigo-700",
                      "disabled:opacity-40 disabled:cursor-not-allowed"
                    )}
                  >
                    {purchasing === num.number ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      "Выбрать"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length > 30 && (
          <p className="text-xs text-gray-400 mt-3 text-center">
            Показано 30 из {filtered.length}. Уточните фильтр для поиска.
          </p>
        )}
      </div>
    </div>
  );
}
