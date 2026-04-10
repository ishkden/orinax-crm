"use client";

import { useState } from "react";
import {
  Building2,
  User,
  Mail,
  Hash,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Типы ─────────────────────────────────────────────────────────────────────

type CustomerType = "legal" | "individual";

interface FormState {
  customerType: CustomerType;
  name: string;
  email: string;
  inn: string;
  kpp: string;
  phone: string;
  passportSeries: string;
  passportNumber: string;
  passportDate: string;
  passportIssuedBy: string;
}

// ─── Утилиты ──────────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-600">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  icon: Icon,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  icon?: React.ElementType;
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn(
          "w-full h-9 rounded-lg border border-gray-200 text-sm text-gray-900",
          "placeholder-gray-400 bg-white transition",
          "focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500",
          Icon ? "pl-8 pr-3" : "px-3"
        )}
      />
    </div>
  );
}

// ─── Компонент ────────────────────────────────────────────────────────────────

export default function McnRegistrationForm({
  onSuccess,
}: {
  onSuccess?: (mcnAccountId: string) => void;
}) {
  const [form, setForm] = useState<FormState>({
    customerType: "legal",
    name: "",
    email: "",
    inn: "",
    kpp: "",
    phone: "",
    passportSeries: "",
    passportNumber: "",
    passportDate: "",
    passportIssuedBy: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typeOpen, setTypeOpen] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: Record<string, string> = {
        customerType: form.customerType,
        name: form.name.trim(),
        email: form.email.trim(),
      };

      if (form.phone.trim()) payload.phone = form.phone.trim();

      if (form.customerType === "legal") {
        payload.inn = form.inn.trim();
        if (form.kpp.trim()) payload.kpp = form.kpp.trim();
      } else {
        if (form.passportSeries.trim()) payload.passportSeries = form.passportSeries.trim();
        if (form.passportNumber.trim()) payload.passportNumber = form.passportNumber.trim();
        if (form.passportDate.trim()) payload.passportDate = form.passportDate.trim();
        if (form.passportIssuedBy.trim()) payload.passportIssuedBy = form.passportIssuedBy.trim();
      }

      const res = await fetch("/api/mcn/register-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "NO_PARTNER_TOKEN") {
          setError(
            "Partner API MCN не настроен на сервере. Обратитесь к администратору ORINAX."
          );
        } else {
          setError(data.error ?? "Не удалось создать аккаунт MCN.");
        }
        return;
      }

      setSuccess(data.mcnAccountId ?? "создан");
      onSuccess?.(data.mcnAccountId);
    } catch {
      setError("Нет связи с сервером.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-green-100 bg-green-50 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-900">MCN-аккаунт успешно создан</p>
            <p className="text-sm text-green-700 mt-0.5">
              Лицевой счёт: <b className="font-mono">{success}</b>
            </p>
            <p className="text-xs text-green-600 mt-1">
              Данные сохранены. Теперь можно подбирать и подключать номера.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const typeLabel = form.customerType === "legal" ? "Юридическое лицо" : "Физическое лицо / ИП";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Инфо-баннер */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 flex items-start gap-2.5">
        <ExternalLink size={13} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          Создание аккаунта через MCN Partner API. Требует активированного партнёрского договора
          с MCN Telecom и переменной{" "}
          <code className="font-mono bg-blue-100 px-1 rounded">MCN_PARTNER_TOKEN</code>{" "}
          на сервере.
        </p>
      </div>

      {/* Тип клиента */}
      <Field label="Тип клиента" required>
        <div className="relative">
          <button
            type="button"
            onClick={() => setTypeOpen((v) => !v)}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 text-left flex items-center justify-between hover:border-gray-300 transition"
          >
            <span>{typeLabel}</span>
            <ChevronDown
              size={13}
              className={cn("text-gray-400 transition-transform", typeOpen && "rotate-180")}
            />
          </button>
          {typeOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg z-10 py-1 overflow-hidden">
              {(["legal", "individual"] as CustomerType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { set("customerType", t); setTypeOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm transition-colors",
                    form.customerType === t
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {t === "legal" ? "Юридическое лицо" : "Физическое лицо / ИП"}
                </button>
              ))}
            </div>
          )}
        </div>
      </Field>

      {/* Основные поля */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field
          label={form.customerType === "legal" ? "Название компании" : "ФИО"}
          required
        >
          <Input
            value={form.name}
            onChange={(v) => set("name", v)}
            placeholder={form.customerType === "legal" ? 'ООО "Ромашка"' : "Иванов Иван Иванович"}
            icon={form.customerType === "legal" ? Building2 : User}
          />
        </Field>

        <Field label="Email" required>
          <Input
            value={form.email}
            onChange={(v) => set("email", v)}
            placeholder="info@company.ru"
            type="email"
            icon={Mail}
          />
        </Field>

        <Field label="Телефон">
          <Input
            value={form.phone}
            onChange={(v) => set("phone", v)}
            placeholder="+7 (900) 123-45-67"
            type="tel"
            icon={Phone}
          />
        </Field>

        {/* Поля для юрлица */}
        {form.customerType === "legal" && (
          <>
            <Field label="ИНН" required hint="10 цифр для ООО/АО, 12 для ИП">
              <Input
                value={form.inn}
                onChange={(v) => set("inn", v.replace(/\D/g, ""))}
                placeholder="7712345678"
                maxLength={12}
                icon={Hash}
              />
            </Field>
            <Field label="КПП" hint="9 цифр, только для юрлиц (не ИП)">
              <Input
                value={form.kpp}
                onChange={(v) => set("kpp", v.replace(/\D/g, ""))}
                placeholder="771201001"
                maxLength={9}
                icon={Hash}
              />
            </Field>
          </>
        )}

        {/* Поля для физлица */}
        {form.customerType === "individual" && (
          <>
            <Field label="Серия паспорта">
              <Input
                value={form.passportSeries}
                onChange={(v) => set("passportSeries", v.replace(/\D/g, ""))}
                placeholder="4510"
                maxLength={4}
              />
            </Field>
            <Field label="Номер паспорта">
              <Input
                value={form.passportNumber}
                onChange={(v) => set("passportNumber", v.replace(/\D/g, ""))}
                placeholder="123456"
                maxLength={6}
              />
            </Field>
            <Field label="Дата выдачи паспорта">
              <Input
                value={form.passportDate}
                onChange={(v) => set("passportDate", v)}
                placeholder="01.01.2015"
                type="date"
              />
            </Field>
            <Field label="Кем выдан" hint="Краткое наименование органа">
              <Input
                value={form.passportIssuedBy}
                onChange={(v) => set("passportIssuedBy", v)}
                placeholder="МВД России"
              />
            </Field>
          </>
        )}
      </div>

      {/* Ошибка */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
          <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Кнопка */}
      <button
        type="submit"
        disabled={loading}
        className={cn(
          "w-full h-10 rounded-lg text-sm font-medium transition-all",
          "bg-indigo-600 text-white hover:bg-indigo-700",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500",
          "flex items-center justify-center gap-2"
        )}
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Создание аккаунта…
          </>
        ) : (
          "Создать кабинет телефонии"
        )}
      </button>
    </form>
  );
}
