import Link from "next/link";
import {
  Users,
  FolderKanban,
  MessageCircle,
  Bell,
  Plug,
  Shield,
  ArrowRight,
  CheckCircle2,
  LogIn,
} from "lucide-react";

const BILLING_HREF = "https://my.orinax.ai/profile?tab=billing";
const ANALYTICS_HREF = "https://my.orinax.ai";

const FEATURES = [
  {
    icon: Users,
    title: "Контакты и компании",
    description:
      "Единая база клиентов с историей взаимодействий. Ищите, фильтруйте и сегментируйте мгновенно.",
  },
  {
    icon: FolderKanban,
    title: "Воронки и сделки",
    description:
      "Настраиваемые воронки под ваш процесс. Перемещайте карточки сделок в канбан-режиме без лишних кликов.",
  },
  {
    icon: MessageCircle,
    title: "Омниканальные сообщения",
    description:
      "WhatsApp, Telegram, VK и другие каналы в одном интерфейсе. Отвечайте клиентам без переключений.",
  },
  {
    icon: Bell,
    title: "Задачи и напоминания",
    description:
      "Планируйте звонки, встречи и задачи прямо в карточке клиента. Никогда не пропускайте follow-up.",
  },
  {
    icon: Plug,
    title: "Синхронизация с Bitrix24",
    description:
      "Двусторонняя синхронизация лидов, сделок и контактов. Изменения в Bitrix появляются мгновенно.",
  },
  {
    icon: Shield,
    title: "Роли и права доступа",
    description:
      "Разграничьте доступ между менеджерами, руководителями и администраторами организации.",
  },
];

const CHECKS = [
  "Неограниченные контакты",
  "До 10 воронок продаж",
  "Мобильный доступ",
  "Онбординг-сессия",
];

const PIPELINE_STAGES = [
  { label: "Новый лид", count: 12, color: "#6366f1" },
  { label: "Квалификация", count: 8, color: "#8b5cf6" },
  { label: "Переговоры", count: 5, color: "#10b981" },
  { label: "Договор", count: 3, color: "#f59e0b" },
  { label: "Закрыто", count: 9, color: "#22c55e" },
];

const CHANNELS = [
  { name: "WhatsApp", color: "#25D366" },
  { name: "Telegram", color: "#2AABEE" },
  { name: "VK", color: "#0077FF" },
  { name: "Avito", color: "#00AAFF" },
  { name: "Bitrix24", color: "#FF5B24" },
  { name: "E-mail", color: "#6366f1" },
];

function CRMIllustration() {
  return (
    <svg
      viewBox="0 0 640 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto drop-shadow-2xl"
    >
      <rect width="640" height="400" rx="12" fill="#1a1f2e" />
      <rect width="640" height="36" rx="12" fill="#222839" />
      <rect y="24" width="640" height="12" fill="#222839" />
      <circle cx="18" cy="18" r="6" fill="#ff5f57" />
      <circle cx="36" cy="18" r="6" fill="#febc2e" />
      <circle cx="54" cy="18" r="6" fill="#28c840" />

      <rect x="0" y="36" width="130" height="364" fill="#141928" />
      {[58, 88, 118, 148, 178, 208].map((y, i) => (
        <rect key={i} x="16" y={y} width={i === 2 ? 98 : 72} height="7" rx="3.5" fill={i === 2 ? "#10b981" : "#252d42"} />
      ))}

      {PIPELINE_STAGES.map((stage, colIdx) => (
        <g key={colIdx}>
          <rect x={142 + colIdx * 100} y={44} width="88" height="14" rx="4" fill={stage.color} opacity="0.15" />
          <rect x={148 + colIdx * 100} y={47} width="52" height="7" rx="3" fill={stage.color} opacity="0.6" />
          <rect x={142 + colIdx * 100} y={64} width="92" height="322" rx="6" fill="#1e2535" />
          {Array.from({ length: Math.min(stage.count, 4) }).map((_, cardIdx) => (
            <g key={cardIdx}>
              <rect x={148 + colIdx * 100} y={72 + cardIdx * 74} width="80" height="64" rx="7" fill="#252d42" />
              <rect x={154 + colIdx * 100} y={80 + cardIdx * 74} width="52" height="6" rx="3" fill="#3a4460" />
              <rect x={154 + colIdx * 100} y={93 + cardIdx * 74} width="36" height="5" rx="2.5" fill={stage.color} opacity="0.5" />
              <circle cx={157 + colIdx * 100} cy={120 + cardIdx * 74} r="7" fill={stage.color} opacity="0.25" />
              <rect x={170 + colIdx * 100} y={117 + cardIdx * 74} width="30" height="5" rx="2.5" fill="#3a4460" />
            </g>
          ))}
        </g>
      ))}

      <rect x="0" y="36" width="640" height="364" fill="url(#crm-fade)" />
      <defs>
        <linearGradient id="crm-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1117" stopOpacity="0" />
          <stop offset="55%" stopColor="#0d1117" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#0d1117" stopOpacity="0.6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function NoOrgPage() {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-4 py-16 bg-[#09090b]">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
          <LogIn className="h-8 w-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">
          Нужна организация из аналитики
        </h1>
        <p className="mt-3 max-w-sm mx-auto text-sm leading-relaxed text-zinc-400">
          Войдите через портал аналитики и выберите компанию — это свяжет ваш аккаунт с CRM автоматически.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={ANALYTICS_HREF}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-500"
          >
            Перейти в аналитику
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

interface CrmPaywallPageProps {
  variant?: "no_org" | "unpaid";
}

export default function CrmPaywallPage({ variant = "unpaid" }: CrmPaywallPageProps) {
  if (variant === "no_org") return <NoOrgPage />;

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col bg-[#09090b]">

      {/* Hero */}
      <section className="relative px-4 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden flex items-start justify-center">
          <div className="mt-[-80px] h-[500px] w-[800px] rounded-full bg-emerald-600/15 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <FolderKanban className="h-3.5 w-3.5" />
            ORINAX CRM
          </span>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            CRM, которая работает{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              так, как вы привыкли
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
            Клиенты, сделки, переписки и задачи в одном интерфейсе.
            Интегрируется с Bitrix24 и мессенджерами за 5 минут.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={BILLING_HREF}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-500 hover:shadow-emerald-500/40"
            >
              Подключить CRM
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={BILLING_HREF}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white"
            >
              Профиль и биллинг
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {CHECKS.map((c) => (
              <span key={c} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CRM Preview */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-1 ring-1 ring-white/5 shadow-2xl shadow-emerald-500/10">
            <CRMIllustration />
          </div>
        </div>
      </section>

      {/* Pipeline preview */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <p className="mb-5 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Воронка продаж — обзор
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {PIPELINE_STAGES.map((stage) => (
                <div
                  key={stage.label}
                  className="min-w-[130px] flex-1 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4"
                >
                  <div
                    className="mb-2 h-1 w-full rounded-full opacity-50"
                    style={{ backgroundColor: stage.color }}
                  />
                  <p className="text-xs font-medium text-zinc-400">{stage.label}</p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: stage.color }}>
                    {stage.count}
                  </p>
                  <p className="text-xs text-zinc-600">сделок</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Всё что нужно для продаж
            </h2>
            <p className="mt-3 text-zinc-400">
              От первого касания до закрытой сделки — без лишних инструментов
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition hover:border-emerald-500/40 hover:bg-zinc-900"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 transition group-hover:bg-emerald-500/20">
                  <Icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Channels */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-8 py-6">
            <p className="mb-6 text-center text-sm font-medium text-zinc-400">
              Работает с вашими каналами коммуникаций
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {CHANNELS.map(({ name, color }) => (
                <span
                  key={name}
                  className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-xs font-medium text-zinc-300"
                  style={{ borderLeftColor: color, borderLeftWidth: 3 }}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats banner */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-px">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-600/90 to-teal-600/90 px-8 py-10">
            <div className="grid gap-8 sm:grid-cols-3 text-center">
              {[
                { value: "5 мин", label: "до первого лида в системе" },
                { value: "6+", label: "каналов коммуникации" },
                { value: "24/7", label: "автосинхронизация с Bitrix" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="text-3xl font-bold text-white">{value}</div>
                  <div className="mt-1 text-sm text-emerald-200">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-white">
            Начните работать в CRM сегодня
          </h2>
          <p className="mt-3 text-zinc-400">
            Оформите подписку и импортируйте данные из Bitrix за несколько минут
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={BILLING_HREF}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-500"
            >
              Подключить за 1 минуту
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
